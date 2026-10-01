import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { fetchPendingCount } from '../lib/queue'
import { QueueCountContext } from './QueueCountContext'

const POLL_MS = 60_000

// Nombre de demandes « à traiter » de l'espace gestion, pour le badge du menu (même chiffre que la pastille
// « À traiter » de la page Réservations). Rechargé toutes les 60 s (onglet visible), au retour sur l'onglet et
// après une action de l'agent (refreshCount). Seulement pour qui peut approuver.
export function QueueCountProvider({ children }) {
  const { can } = useAuth()
  const active = can('reservations.approve')
  const [pendingCount, setPendingCount] = useState(0)

  // Compteur indicatif : une erreur passagère ne doit rien casser (401 gérée par le client)
  const refreshCount = useCallback(
    () =>
      fetchPendingCount()
        .then(setPendingCount)
        .catch(() => {}),
    [],
  )

  useEffect(() => {
    if (!active) return undefined
    fetchPendingCount()
      .then(setPendingCount)
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
    () => ({ pendingCount: active ? pendingCount : 0, refreshCount }),
    [active, pendingCount, refreshCount],
  )
  return <QueueCountContext.Provider value={value}>{children}</QueueCountContext.Provider>
}
