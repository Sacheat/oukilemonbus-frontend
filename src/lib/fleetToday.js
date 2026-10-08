import { formatLocalDateTime, formatTime } from './dates'
import { isTripMoving, planningDayLink, toMinutes } from './dashboard'

// État du jour d'un véhicule ou d'un chauffeur (cartes des pages Véhicules et Chauffeurs), du plus important au moins :
//   indisponible maintenant (indisponibilité en cours)   → orange, jusqu'à quand et motif
//   en route (étapes réelles du chauffeur)               → bleu, retour prévu
//   trajets aujourd'hui                                   → leurs heures (ceux encore à venir, sinon « terminés »)
//   rien                                                   → libre aujourd'hui
// `kind` : 'vehicle' ou 'driver' ; `today` : { trips (GET /planning du jour), unavailabilities (?current=1),
// progress (avancement par reservation_id) } ; `nowTime` : "HH:mm" à Bruxelles. null : état encore inconnu.
export function fleetDayState(kind, id, today, nowTime) {
  if (!today) return null
  const key = kind === 'vehicle' ? 'vehicle_id' : 'driver_id'
  const unavailability = today.unavailabilities.find((item) => item[key] === id)
  if (unavailability) {
    return {
      tone: 'warning',
      text: `Indisponible jusqu’au ${formatLocalDateTime(unavailability.end_datetime)}`,
      detail: unavailability.reason,
    }
  }

  const trips = today.trips
    .filter((trip) => (kind === 'vehicle' ? trip.vehicle?.id : trip.driver?.id) === id)
    .sort((first, second) => first.departure_time.localeCompare(second.departure_time))
  const moving = trips.find((trip) => isTripMoving(today.progress?.[trip.reservation_id]))
  if (moving) {
    return { tone: 'info', text: `En route · retour prévu à ${formatTime(moving.return_time)}`, detail: moving.organization?.name }
  }
  if (trips.length === 0) return { tone: 'success', text: 'Libre aujourd’hui', detail: null }

  const now = toMinutes(nowTime)
  const upcoming = trips.filter((trip) => toMinutes(trip.return_time) > now)
  const count = `${trips.length} trajet${trips.length > 1 ? 's' : ''} aujourd’hui`
  if (upcoming.length === 0) return { tone: 'neutral', text: `${count}, terminés`, detail: null }
  return {
    tone: 'neutral',
    text: count,
    detail: upcoming.map((trip) => `${formatTime(trip.departure_time)} – ${formatTime(trip.return_time)}`).join(', '),
  }
}

// Planning du jour filtré sur ce véhicule ou ce chauffeur (vue liste, ?vehicule= ou ?chauffeur=)
export function fleetPlanningLink(kind, id, day) {
  return `${planningDayLink(day)}&${kind === 'vehicle' ? 'vehicule' : 'chauffeur'}=${id}`
}
