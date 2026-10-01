import { useCallback } from 'react'
import { fetchAllPages } from '../api/pagination'
import { getReservations } from '../api/reservations'
import { weekMissionsParams } from '../lib/routeSheets'
import { useApi } from './useApi'

// Missions confirmées du chauffeur pour une semaine (celles de sa feuille de route). Une semaine tient en 1 ou 2
// pages ; garde-fou à 5 pages. `weekStart` (texte) : rechargement seulement quand la semaine change.
export function useWeekMissions(weekStart) {
  const fetchMissions = useCallback(
    (signal) =>
      fetchAllPages((page) => getReservations({ ...weekMissionsParams(weekStart), page }, { signal }), {
        signal,
        maxPages: 5,
      }),
    [weekStart],
  )
  const missions = useApi(fetchMissions)
  return { ...missions, data: missions.loading ? undefined : missions.data }
}
