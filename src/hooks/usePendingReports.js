import { getReservations } from '../api/reservations'
import { getTripReports } from '../api/tripReports'
import { addDays, todayInBrussels } from '../lib/planning'
import { isReportPending, reportsByReservation } from '../lib/tripReports'
import { useApi } from './useApi'

// Missions du chauffeur dont le compte rendu est attendu : confirmées, d'hier ou d'aujourd'hui (le délai court
// jusqu'au lendemain 12:00), commencées et sans compte rendu. Deux petites requêtes, quel que soit l'historique.
// Défini hors du composant : fetcher stable (« aujourd'hui » est relu à chaque chargement).
async function fetchPendingReports(signal) {
  const today = todayInBrussels()
  const missions = await getReservations(
    { date_from: addDays(today, -1), date_to: today, statuses: ['confirme'], sort: 'asc' },
    { signal },
  )
  const missionList = missions.data
  if (missionList.length === 0) return []
  const reports = reportsByReservation(await getTripReports(missionList.map((mission) => mission.id), { signal }))
  return missionList.filter((mission) => isReportPending(mission, reports[mission.id]))
}

export function usePendingReports() {
  return useApi(fetchPendingReports)
}
