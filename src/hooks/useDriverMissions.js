import { useCallback } from 'react'
import { getReservations } from '../api/reservations'
import { missionListParams } from '../lib/driverMissions'
import { useApi } from './useApi'

// Missions du chauffeur connecté pour un onglet et une page (le backend ne renvoie que les siennes, 15 par page).
// `period`, `page` et `today` sont des valeurs simples : rechargement seulement quand l'une change.
// Pendant un chargement, `data` vaut undefined : on n'affiche pas un instant les missions de l'autre onglet.
export function useDriverMissions(period, page, today) {
  const fetchMissions = useCallback(
    (signal) => getReservations(missionListParams(period, page, today), { signal }),
    [period, page, today],
  )
  const missions = useApi(fetchMissions)
  return { ...missions, data: missions.loading ? undefined : missions.data }
}
