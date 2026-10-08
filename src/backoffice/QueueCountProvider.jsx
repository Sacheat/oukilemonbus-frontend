import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { activeNavCounts, fetchNavCounts } from '../lib/navCounts'
import { QueueCountContext } from './QueueCountContext'

const POLL_MS = 60_000

// Compteurs de la barre latérale de l'espace gestion (NAV_COUNTS : réservations à traiter, Collège à décider,
// demandes à examiner, demandes d'aide en cours), chacun selon sa permission. Un seul minuteur pour tous : relus toutes
// les 60 s (onglet visible), au retour sur l'onglet et après une action de l'agent (refreshCount).
// `pendingCount` : réservations à traiter (badge de « Réservations », bouton du tableau de bord).
export function QueueCountProvider({ children }) {
  const { can } = useAuth()
  const keysText = activeNavCounts(can).join(',')
  const [counts, setCounts] = useState({})

  const refreshCount = useCallback(() => {
    if (!keysText) return
    fetchNavCounts(keysText.split(','))
      .then(setCounts)
      .catch(() => {})
  }, [keysText])

  useEffect(() => {
    if (!keysText) return undefined
    refreshCount()
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
  }, [keysText, refreshCount])

  const value = useMemo(() => ({ counts, pendingCount: counts.queue ?? 0, refreshCount }), [counts, refreshCount])
  return <QueueCountContext.Provider value={value}>{children}</QueueCountContext.Provider>
}
