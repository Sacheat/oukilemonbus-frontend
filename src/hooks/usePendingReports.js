import { getReservations } from '../api/reservations'
import { addDays, todayInBrussels } from '../lib/planning'
import { isReportPending } from '../lib/tripReports'
import { useApi } from './useApi'

// Missions du chauffeur dont le compte rendu est attendu : confirmées, d'hier ou d'aujourd'hui (le délai court
// jusqu'au lendemain 12:00), commencées et sans compte rendu. Un seul appel, compte rendu joint (include=trip_report),
// quel que soit l'historique. Défini hors du composant : fetcher stable (« aujourd'hui » est relu à chaque chargement).
async function fetchPendingReports(signal) {
  const today = todayInBrussels()
  const missions = await getReservations(
    { date_from: addDays(today, -1), date_to: today, statuses: ['confirme'], sort: 'asc', include: 'trip_report' },
    { signal },
  )
  // Sans la clé trip_report (backend pas à jour), rien n'est annoncé plutôt qu'un faux « à faire »
  return missions.data.filter((mission) => 'trip_report' in mission && isReportPending(mission, mission.trip_report))
}

export function usePendingReports() {
  return useApi(fetchPendingReports)
}
