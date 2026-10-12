import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { onSessionLost } from '../api/client'
import { clearAllDrafts } from '../lib/drafts'
import { AuthContext } from './AuthContext'
import * as permissions from './permissions'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' tant que la session n'est pas restaurée
  // Message affiché sur la page de connexion après une fin de session : { tone, message }
  const [sessionNotice, setSessionNotice] = useState(null)

  // Restaure la session au chargement de la SPA
  useEffect(() => {
    const controller = new AbortController()
    authApi
      .fetchMe({ signal: controller.signal })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        if (!controller.signal.aborted) setStatus('ready')
      })
    return () => controller.abort()
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
    const loggedUser = await authApi.login(credentials)
    setSessionNotice(null)
    setUser(loggedUser)
    return loggedUser
  }, [])

  const register = useCallback(async (payload) => {
    const newUser = await authApi.register(payload)
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
      markTourSeen,
      resetTour,
      can: (permission) => permissions.can(user, permission),
      hasRole: (...roles) => permissions.hasRole(user, ...roles),
      isInternal: () => permissions.isInternal(user),
      isManagerOf: (organizationId) => permissions.isManagerOf(user, organizationId),
    }),
    [user, status, sessionNotice, login, register, logout, clearSession, refresh, markTourSeen, resetTour],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
