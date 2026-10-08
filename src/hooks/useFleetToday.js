import { getTripProgressList } from '../api/tripProgress'
import { getPlanning } from '../api/planning'
import { getUnavailabilities } from '../api/unavailabilities'
import { progressByReservation } from '../lib/driverJourney'
import { ACTIVE_STATUSES, todayInBrussels } from '../lib/planning'
import { useApi } from './useApi'
import { useAutoRefresh } from './useAutoRefresh'

// Trajets du jour (GET /planning, statuts actifs), indisponibilités en cours (GET /unavailabilities?current=1) et
// avancement réel des trajets du jour (GET /trip-progress) : de quoi dire l'état du jour de chaque véhicule et
// chauffeur (fleetDayState). Relus toutes les 60 s et au retour sur l'onglet. `data` : { day, trips, unavailabilities,
// progress } ; une erreur laisse simplement les cartes sans état du jour.
async function fetchFleetToday(signal) {
  const day = todayInBrussels()
  const [planning, unavailabilities] = await Promise.all([
    getPlanning({ start_date: day, end_date: day, statuses: ACTIVE_STATUSES }, { signal }),
    getUnavailabilities({ current: 1 }, { signal }),
  ])
  const trips = planning.data
  const ids = trips.map((trip) => trip.reservation_id)
  const progress = ids.length > 0 ? progressByReservation(await getTripProgressList(ids, { signal })) : {}
  return { day, trips, unavailabilities: unavailabilities.data, progress }
}

export function useFleetToday() {
  const today = useApi(fetchFleetToday)
  useAutoRefresh(today.reload)
  return today.data
}
