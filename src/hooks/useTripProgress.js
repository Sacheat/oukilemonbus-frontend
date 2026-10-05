import { useCallback } from 'react'
import { getTripProgressList } from '../api/tripProgress'
import { progressByReservation } from '../lib/driverJourney'
import { useApi } from './useApi'
import { useAutoRefresh } from './useAutoRefresh'

// Avancement des trajets affichés (badges « En route », « Sur place »…), indexé par reservation_id, relu toutes les
// 60 s et au retour sur l'onglet : le Planning suit les boutons des chauffeurs sans recharger la page.
// `idsKey` : identifiants séparés par des virgules ; `data` undefined tant que l'index ne correspond pas à la liste.
export function useTripProgress(idsKey) {
  const fetchProgress = useCallback(
    (signal) => {
      const ids = idsKey ? idsKey.split(',').map(Number) : []
      if (ids.length === 0) return Promise.resolve({ idsKey, progress: {} })
      return getTripProgressList(ids, { signal }).then((list) => ({ idsKey, progress: progressByReservation(list) }))
    },
    [idsKey],
  )
  const result = useApi(fetchProgress)
  useAutoRefresh(result.reload)
  return { ...result, data: result.data?.idsKey === idsKey ? result.data.progress : undefined }
}
