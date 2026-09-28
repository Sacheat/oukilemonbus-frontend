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

// Corps attendu par check-trip (trajet seul), ou null tant que le trajet est incomplet
export function toTripPayload(values) {
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
  return complete ? trip : null
}

// Corps de preview / création
export function toReservationPayload(values) {
  return {
    ...toTripPayload(values),
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
