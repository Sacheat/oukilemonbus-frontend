import { isManagerOf } from '../auth/permissions'
import { formatApproxTime, toApiDate } from './dates'

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

// Décision du Collège exigée avant l'approbation : selon le type d'organisation (`organization.rules.council_required`,
// tiré de la config du backend : CPAS, ASBL, externes). Repli sur `approval_type` si les règles ne sont pas fournies.
// Pour les autres types (écoles, personnel communal), elle reste possible mais facultative (dérogation horaire).
export function needsCouncilDecision(reservation) {
  const required = reservation.organization?.rules?.council_required
  return typeof required === 'boolean' ? required : reservation.approval_type === 'manuel'
}

// Plus aucune action une fois la date du trajet passée
function isPast(reservation) {
  return reservation.trip_date < todayApiDate()
}

// Trajet commencé (le chauffeur a signalé son départ) : plus d'annulation, comme le backend
export function canCancel(user, reservation) {
  return (
    CANCELLABLE_STATUSES.includes(reservation.status) &&
    !isPast(reservation) &&
    !reservation.trip_started_at &&
    isRequesterOrManager(user, reservation)
  )
}

export const EDITABLE_STATUSES = ['en_attente', 'en_conflit']

// Modification côté usager : demandeur ou responsable, tant que la demande n'est pas acceptée
export function canEdit(user, reservation) {
  return EDITABLE_STATUSES.includes(reservation.status) && !isPast(reservation) && isRequesterOrManager(user, reservation)
}

export function canConfirmPassengers(user, reservation) {
  return !isTerminal(reservation) && !isPast(reservation) && isRequesterOrManager(user, reservation)
}

// Où en est la demande, en une phrase pour l'usager (au passé une fois la date dépassée)
export function statusHint(reservation) {
  if (reservation.trip_date < todayApiDate() && !isTerminal(reservation)) {
    if (reservation.status === 'confirme') return 'Trajet effectué.'
    if (reservation.status === 'approuve') return 'Trajet passé : il avait été accepté par la commune.'
    return 'Date passée : la demande n’a pas été validée à temps.'
  }
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

// Heures d'arrivée estimées, calculées par le backend dans `estimated_occupation` (détail, liste, preview,
// check-trip) : à destination (`outbound_arrival_at`) et de retour au lieu de départ (`return_arrival_at`).
// Arrondies à 5 min ; null tant que le backend ne les renvoie pas ou sans durée estimée.
export function estimatedArrivals(result) {
  const occupation = result?.estimated_occupation
  const outbound = formatApproxTime(occupation?.outbound_arrival_at)
  const back = formatApproxTime(occupation?.return_arrival_at)
  return outbound || back ? { outbound, back } : null
}
