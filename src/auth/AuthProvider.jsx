import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { onSessionLost } from '../api/client'
import { AuthContext } from './AuthContext'
import * as permissions from './permissions'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' tant que la session n'est pas restaurée
  // Message à afficher sur la page de connexion après une déconnexion subie
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
          setSessionNotice(
            reason === 'disabled' ? message : 'Votre session a expiré. Reconnectez-vous.',
          )
        }
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

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const freshUser = await authApi.fetchMe()
    setUser(freshUser)
    return freshUser
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      sessionNotice,
      login,
      logout,
      refresh,
      can: (permission) => permissions.can(user, permission),
      hasRole: (...roles) => permissions.hasRole(user, ...roles),
      isInternal: () => permissions.isInternal(user),
      isManagerOf: (organizationId) => permissions.isManagerOf(user, organizationId),
    }),
    [user, status, sessionNotice, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
