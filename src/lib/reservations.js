import { isManagerOf } from '../auth/permissions'
import { toApiDate } from './dates'

export const TERMINAL_STATUSES = ['refuse', 'annule']
export const CANCELLABLE_STATUSES = ['en_attente', 'en_conflit', 'approuve', 'confirme']

export function isTerminal(reservation) {
  return TERMINAL_STATUSES.includes(reservation.status)
}

export function totalPassengers(reservation) {
  return reservation.nb_children + reservation.nb_adults
}

// Demandeur ou responsable de l'organisation (le backend vérifie aussi les délais)
export function isRequesterOrManager(user, reservation) {
  return reservation.requested_by_user_id === user.id || isManagerOf(user, reservation.organization_id)
}

export function canCancel(user, reservation) {
  return CANCELLABLE_STATUSES.includes(reservation.status) && isRequesterOrManager(user, reservation)
}

export function canConfirmPassengers(user, reservation) {
  return !isTerminal(reservation) && isRequesterOrManager(user, reservation)
}

// Où en est la demande, en une phrase pour l'usager
export function statusHint(reservation) {
  switch (reservation.status) {
    case 'en_attente':
      return reservation.approval_type === 'manuel'
        ? 'En attente de validation par la commune.'
        : 'Demande enregistrée, validation en cours.'
    case 'approuve':
      return 'Demande acceptée : affectation du chauffeur et du véhicule en cours.'
    case 'confirme':
      return 'Chauffeur et véhicule affectés : le trajet aura lieu.'
    case 'en_conflit':
      return 'Un problème bloque la demande pour le moment. La commune s’en occupe.'
    case 'refuse':
      return reservation.rejection_reason ? `Refusée : ${reservation.rejection_reason}` : 'Demande refusée.'
    case 'annule':
      return reservation.cancellation_reason ? `Annulée : ${reservation.cancellation_reason}` : 'Réservation annulée.'
    default:
      return ''
  }
}

// Adresse lisible : "Rue de Ciney 81, Ohey" plutôt que "Rue de Ciney 81, Ohey, NA, Belgium"
export function shortAddress(location) {
  if (!location) return ''
  const street = [location.street, location.street_number].filter(Boolean).join(' ')
  const parts = [street, location.city].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : location.formatted_address
}

export function todayApiDate() {
  return toApiDate(new Date())
}

export function yesterdayApiDate() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return toApiDate(date)
}

// Clé de tri chronologique : "2026-10-16 10:00:00"
export function tripKey(reservation) {
  return `${reservation.trip_date} ${reservation.departure_time}`
}
