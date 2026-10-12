import axios from 'axios'

// Auth Sanctum en mode SPA : session portée par un cookie HttpOnly + jeton CSRF.
// Jamais de token Bearer ni de token en localStorage (voir le guide API).
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:8080'

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, // envoie et reçoit les cookies de session
  withXSRFToken: true, // recopie le cookie XSRF-TOKEN dans le header X-XSRF-TOKEN
  headers: { Accept: 'application/json' },
})

// À appeler avant le login et l'inscription (route hors préfixe /api)
export const csrf = () => api.get('/sanctum/csrf-cookie', { baseURL: API_ORIGIN })

// L'AuthProvider s'abonne ici pour réagir à une session perdue (401)
// ou à un compte désactivé (403).
let sessionLostHandler = null

export function onSessionLost(handler) {
  sessionLostHandler = handler
  return () => {
    if (sessionLostHandler === handler) sessionLostHandler = null
  }
}

const DISABLED_ACCOUNT_MESSAGE = 'Ce compte a été désactivé.'

// 429 sur une lecture : attente maximale avant de la rejouer (au-delà, l'erreur s'affiche tout de suite)
const MAX_RETRY_WAIT_SECONDS = 5
const DEFAULT_RETRY_WAIT_SECONDS = 2

// Secondes à attendre d'après Retry-After (exposé par le CORS du backend), ou null s'il ne sert à rien de réessayer
function retryWaitSeconds(response) {
  const announced = Number(response.headers?.['retry-after'])
  if (!Number.isFinite(announced)) return DEFAULT_RETRY_WAIT_SECONDS
  return announced > MAX_RETRY_WAIT_SECONDS ? null : Math.max(announced, 1)
}

// Attente interrompue si la requête est annulée entre-temps (page quittée, nouvelle recherche)
function wait(seconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, seconds * 1000)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new axios.CanceledError())
    }, { once: true })
  })
}

api.interceptors.response.use(undefined, async (error) => {
  const { response, config } = error
  if (!response) return Promise.reject(error)

  // 419 : jeton CSRF absent ou expiré → on le renouvelle et on rejoue une fois
  if (response.status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true
    await csrf()
    return api(config)
  }

  // 429 (trop de requêtes) sur une lecture : on attend le délai annoncé puis on la rejoue une fois.
  // Jamais une action (POST, PATCH…) : la rejouer pourrait l'envoyer deux fois.
  if (response.status === 429 && config?.method === 'get' && !config._rateRetried) {
    const seconds = retryWaitSeconds(response)
    if (seconds !== null) {
      config._rateRetried = true
      await wait(seconds, config.signal)
      return api(config)
    }
  }

  if (response.status === 401) {
    sessionLostHandler?.({ reason: 'unauthenticated' })
  } else if (response.status === 403 && response.data?.message === DISABLED_ACCOUNT_MESSAGE) {
    sessionLostHandler?.({ reason: 'disabled', message: response.data.message })
  }

  return Promise.reject(error)
})
