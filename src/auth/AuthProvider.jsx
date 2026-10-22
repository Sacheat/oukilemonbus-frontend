import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { onSessionLost } from '../api/client'
import { clearAllDrafts } from '../lib/drafts'
import { AuthContext } from './AuthContext'
import * as permissions from './permissions'

// Connexion ou inscription (routes réservées aux invités). Un 409 veut dire que le navigateur a encore une session
// ouverte que la SPA ne connaît pas (session non relue pendant une panne, autre onglet) : on la ferme puis on rejoue,
// pour le compte saisi, qui n'est pas forcément le même. Si la déconnexion échoue, son erreur (500, compte désactivé)
// est plus parlante que « Vous êtes déjà connecté ».
async function asGuest(action) {
  try {
    return await action()
  } catch (error) {
    if (error.response?.status !== 409) throw error
    await authApi.logout()
    clearAllDrafts()
    return action()
  }
}

// Lit la session : { user, status }. Seule une 401 (ou un compte désactivé, 403) veut dire « pas connecté » : une 500
// ou un serveur injoignable ne dit rien de la session, qui est peut-être encore ouverte. L'afficher comme une
// déconnexion menait à la page de connexion, puis au 409 « Vous êtes déjà connecté ».
async function readSession(signal) {
  try {
    return { user: await authApi.fetchMe({ signal }), status: 'ready' }
  } catch (error) {
    const signedOut = [401, 403].includes(error.response?.status)
    return { user: null, status: signedOut ? 'ready' : 'unavailable' }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // 'loading' tant que la session n'est pas restaurée, 'unavailable' si le serveur n'a pas pu répondre
  const [status, setStatus] = useState('loading')
  // Message affiché sur la page de connexion après une fin de session : { tone, message }
  const [sessionNotice, setSessionNotice] = useState(null)

  // Restaure la session au chargement de la SPA
  useEffect(() => {
    const controller = new AbortController()
    readSession(controller.signal).then((session) => {
      if (controller.signal.aborted) return
      setUser(session.user)
      setStatus(session.status)
    })
    return () => controller.abort()
  }, [])

  // « Réessayer » de la page Service indisponible
  const retrySession = useCallback(async () => {
    setStatus('loading')
    const session = await readSession()
    setUser(session.user)
    setStatus(session.status)
  }, [])

  const userRef = useRef(null)
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(
    () =>
      onSessionLost(({ reason, message }) => {
        // Pas de message si personne n'était connecté (ex. 401 au démarrage)
        if (userRef.current) {
          setSessionNotice({
            tone: 'warning',
            message: reason === 'disabled' ? message : 'Votre session a expiré. Reconnectez-vous.',
          })
        }
        clearAllDrafts()
        setUser(null)
      }),
    [],
  )

  const login = useCallback(async (credentials) => {
    const loggedUser = await asGuest(() => authApi.login(credentials))
    setSessionNotice(null)
    setUser(loggedUser)
    return loggedUser
  }, [])

  const register = useCallback(async (payload) => {
    const newUser = await asGuest(() => authApi.register(payload))
    setSessionNotice(null)
    setUser(newUser)
    return newUser
  }, [])

  // Termine une session que le backend a invalidée (réinitialisation du mot de passe par email).
  // Le cookie de session reste périmé côté navigateur : sans cet appel, la requête suivante
  // (même une route publique) recevrait une 401. L'échec attendu du logout vide la session côté backend.
  // `notice` : { tone, message } affiché sur la page de connexion.
  const clearSession = useCallback(async (notice = null) => {
    await authApi.logout().catch(() => {})
    clearAllDrafts()
    setSessionNotice(notice)
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearAllDrafts()
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const freshUser = await authApi.fetchMe()
    setUser(freshUser)
    return freshUser
  }, [])

  // Tutoriels : mis à jour tout de suite (le tutoriel ne revient pas pendant l'appel), puis par la réponse.
  // Un échec de markTourSeen est ignoré : le tutoriel sera simplement reproposé à la prochaine session.
  const setToursSeen = useCallback((update) => {
    setUser((current) => (current ? { ...current, tours_seen: update(current.tours_seen ?? {}) } : current))
  }, [])

  const markTourSeen = useCallback(
    async (tour) => {
      setToursSeen((seen) => ({ ...seen, [tour]: seen[tour] ?? new Date().toISOString() }))
      try {
        const seen = await authApi.markTourSeen(tour)
        setToursSeen(() => seen)
      } catch {
        // voir plus haut
      }
    },
    [setToursSeen],
  )

  const resetTour = useCallback(
    async (tour) => {
      const seen = await authApi.resetTour(tour)
      setToursSeen(() => seen)
    },
    [setToursSeen],
  )

  const value = useMemo(
    () => ({
      user,
      status,
      sessionNotice,
      login,
      register,
      logout,
      clearSession,
      refresh,
      retrySession,
      markTourSeen,
      resetTour,
      can: (permission) => permissions.can(user, permission),
      hasRole: (...roles) => permissions.hasRole(user, ...roles),
      isInternal: () => permissions.isInternal(user),
      isManagerOf: (organizationId) => permissions.isManagerOf(user, organizationId),
    }),
    [user, status, sessionNotice, login, register, logout, clearSession, refresh, retrySession, markTourSeen, resetTour],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
