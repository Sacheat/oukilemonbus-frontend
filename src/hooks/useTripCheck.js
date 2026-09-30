import { checkTrip } from '../api/reservations'
import { withoutSelfConflicts } from '../lib/reservationForm'
import { useLiveCheck } from './useLiveCheck'

// En modification, la réservation ne doit pas entrer en conflit avec elle-même
function ignoreSelf(result, trip) {
  return withoutSelfConflicts(result, trip.reservation_id)
}

// Vérifie le trajet en direct pendant la saisie (préavis, week-end, distance, disponibilité…).
// `trip` : corps de check-trip, ou null tant que le trajet est incomplet.
export function useTripCheck(trip) {
  return useLiveCheck(checkTrip, trip, ignoreSelf)
}
