import { toApiDate } from './dates'

// Valeurs de l'assistant de réservation. Les lieux sont des objets Location (ou null).
export const EMPTY_RESERVATION = {
  organization_id: '',
  trip_date: '',
  departure_time: '',
  return_time: '',
  pickup: null,
  destination: null,
  nb_children: '0',
  nb_adults: '',
  activity_type: 'standard',
  trip_purpose: '',
}

export const STEP_FIELDS = {
  1: ['organization_id', 'trip_date', 'departure_time', 'return_time', 'pickup', 'destination'],
  2: ['nb_children', 'nb_adults', 'activity_type', 'trip_purpose'],
}

// Noms des champs du backend → champs du formulaire
const API_FIELD_TO_FORM = { pickup_location_id: 'pickup', destination_location_id: 'destination' }

export function mapApiErrors(apiErrors) {
  return Object.fromEntries(
    Object.entries(apiErrors).map(([field, message]) => [API_FIELD_TO_FORM[field] ?? field, message]),
  )
}

export function stepOfField(field) {
  if (STEP_FIELDS[1].includes(field)) return 1
  if (STEP_FIELDS[2].includes(field)) return 2
  return null
}

// Contrôle minimal avant de changer d'étape ; les règles métier restent au backend
export function missingFields(values, step) {
  const errors = {}
  for (const field of STEP_FIELDS[step]) {
    if (values[field] === '' || values[field] === null) errors[field] = 'Ce champ est obligatoire.'
  }
  return errors
}

// Corps attendu par check-trip (trajet seul), ou null tant que le trajet est incomplet.
// `reservationId` (modification) : la réservation est ignorée dans les calculs de disponibilité et de quota.
export function toTripPayload(values, reservationId = null) {
  const trip = {
    organization_id: Number(values.organization_id),
    pickup_location_id: values.pickup?.id,
    destination_location_id: values.destination?.id,
    trip_date: values.trip_date,
    departure_time: values.departure_time,
    return_time: values.return_time,
    activity_type: values.activity_type,
  }
  const complete = values.organization_id && trip.pickup_location_id && trip.destination_location_id &&
    trip.trip_date && trip.departure_time && trip.return_time
  if (!complete) return null
  return reservationId ? { ...trip, reservation_id: reservationId } : trip
}

// Corps de preview / création
export function toReservationPayload(values, reservationId = null) {
  return {
    ...toTripPayload(values, reservationId),
    nb_children: Number(values.nb_children || 0),
    nb_adults: Number(values.nb_adults),
    trip_purpose: values.trip_purpose.trim(),
  }
}

// Écoles et personnel communal : approbation automatique, pas de restriction horaire
export const PRIORITY_ORGANIZATION_TYPES = ['ecole_communale', 'personnel_communal']

// Préavis de 15 jours : première date possible
export function minTripDate() {
  const date = new Date()
  date.setDate(date.getDate() + 15)
  return toApiDate(date)
}

// Réservation existante → valeurs du formulaire (mode modification)
export function reservationToValues(reservation) {
  return {
    organization_id: String(reservation.organization_id),
    trip_date: reservation.trip_date,
    departure_time: reservation.departure_time.slice(0, 5),
    return_time: reservation.return_time.slice(0, 5),
    pickup: reservation.pickup_location ?? null,
    destination: reservation.destination_location ?? null,
    nb_children: String(reservation.nb_children),
    nb_adults: String(reservation.nb_adults),
    activity_type: reservation.activity_type,
    trip_purpose: reservation.trip_purpose,
  }
}

// Corps du PATCH : tout sauf l'organisation (non modifiable)
export function toUpdatePayload(values) {
  // eslint-disable-next-line no-unused-vars
  const { organization_id, ...rest } = toReservationPayload(values)
  return rest
}

// Valeur comparable d'un champ (les lieux par leur id)
function comparable(values, field) {
  const value = values[field]
  if (field === 'pickup' || field === 'destination') return value?.id ?? null
  if (field === 'trip_purpose') return value.trim()
  return String(value)
}

// Champs modifiés par rapport à la réservation d'origine
export function changedFields(original, values) {
  return [...STEP_FIELDS[1], ...STEP_FIELDS[2]].filter((field) => comparable(original, field) !== comparable(values, field))
}

// Tant que le backend n'accepte pas reservation_id sur preview / check-trip, la réservation
// modifiée peut entrer en conflit avec elle-même : on retire ces faux problèmes.
export function withoutSelfConflicts(result, reservationId) {
  if (!result || !reservationId) return result
  const availability = result.availability
  const blockedBySelf = availability && !availability.is_available && availability.blocking_reservation_id === reservationId
  return {
    ...result,
    availability: blockedBySelf ? { ...availability, is_available: true, message: null } : availability,
    conflicts: (result.conflicts ?? []).filter((conflict) => conflict.related_reservation_id !== reservationId),
  }
}
