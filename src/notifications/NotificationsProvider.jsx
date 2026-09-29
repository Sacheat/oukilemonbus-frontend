import { useCallback, useEffect, useMemo, useState } from 'react'
import { getUnreadCount } from '../api/notifications'
import { isEmailVerified } from '../auth/permissions'
import { useAuth } from '../auth/useAuth'
import { NotificationsContext } from './NotificationsContext'

const POLL_MS = 60_000

// Nombre de notifications non lues, partagé entre la cloche et la page des notifications.
// Rechargé toutes les 60 s (onglet visible), au retour sur l'onglet et après une lecture (refreshCount).
export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const active = Boolean(user && isEmailVerified(user))
  const [unreadCount, setUnreadCount] = useState(0)

  // Compteur indicatif : une erreur passagère ne doit rien casser (401 gérée par le client)
  const refreshCount = useCallback(
    () =>
      getUnreadCount()
        .then(setUnreadCount)
        .catch(() => {}),
    [],
  )

  useEffect(() => {
    if (!active) return undefined
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {})
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshCount()
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshCount()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, refreshCount])

  const value = useMemo(
    () => ({ unreadCount: active ? unreadCount : 0, refreshCount }),
    [active, unreadCount, refreshCount],
  )
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
