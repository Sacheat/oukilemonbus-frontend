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

api.interceptors.response.use(undefined, async (error) => {
  const { response, config } = error
  if (!response) return Promise.reject(error)

  // 419 : jeton CSRF absent ou expiré → on le renouvelle et on rejoue une fois
  if (response.status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true
    await csrf()
    return api(config)
  }

  if (response.status === 401) {
    sessionLostHandler?.({ reason: 'unauthenticated' })
  } else if (response.status === 403 && response.data?.message === DISABLED_ACCOUNT_MESSAGE) {
    sessionLostHandler?.({ reason: 'disabled', message: response.data.message })
  }

  return Promise.reject(error)
})
