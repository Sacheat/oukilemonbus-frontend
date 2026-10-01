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

// Erreur de capacité à l'étape Passagers : plus de passagers que de places dans le plus grand bus
// (`max` = max_passengers renvoyé par le backend ; null ou absent : pas de limite côté front)
export function capacityError(values, max) {
  const total = Number(values.nb_children || 0) + Number(values.nb_adults || 0)
  return max != null && total > max ? { nb_children: `Trop de passagers : ${max} places au maximum.` } : null
}

// Réservation « en devenir » pour afficher le billet (TripHero) à l'étape Vérification :
// valeurs saisies + heures estimées du preview (`result`, facultatif)
export function draftReservation(values, result = null) {
  return {
    trip_date: values.trip_date,
    departure_time: values.departure_time,
    return_time: values.return_time,
    pickup_location: values.pickup,
    destination_location: values.destination,
    trip_purpose: values.trip_purpose.trim() || 'Votre déplacement',
    estimated_occupation: result?.estimated_occupation ?? null,
  }
}

// Nombre de modifications à annoncer : les deux horaires comptent pour une seule (« Horaires »)
export function changedRowCount(changes) {
  const times = changes.includes('departure_time') || changes.includes('return_time')
  return changes.filter((field) => field !== 'departure_time' && field !== 'return_time').length + (times ? 1 : 0)
}

// Ce que deviendra la demande à l'envoi, d'après le preview (le backend crée la réservation avec son
// `status`) : bloquée, en conflit, approuvée automatiquement ou examinée par la commune (en attente)
// Effet d'une modification faite par un agent (espace gestion), d'après le preview et le statut actuel.
// Le backend garde le statut, passe en conflit s'il en détecte un, et sort une réservation en conflit corrigée
// vers « en attente » (ou approuvée et affectée pour une école ou le personnel communal).
export function agentEditDecision(result, currentStatus) {
  if (!result.is_allowed) {
    return {
      tone: 'danger',
      title: 'Ces changements ne peuvent pas être enregistrés',
      text: 'Modifiez le trajet ou les horaires : la vérification sera relancée.',
    }
  }
  if (result.conflicts?.length > 0) {
    return {
      tone: 'warning',
      title: 'Toujours en conflit après l’enregistrement',
      text: 'Les points ci-dessous resteront à régler depuis la file des réservations.',
    }
  }
  if (currentStatus === 'en_conflit') {
    return {
      tone: 'success',
      title: 'Conflit levé',
      text: 'Plus aucun conflit : la réservation repassera en attente (approuvée et affectée automatiquement pour une école ou le personnel communal).',
    }
  }
  return { tone: 'info', title: 'Aucun conflit', text: 'Le statut de la réservation ne change pas.' }
}

export function reservationDecision(result, mode = 'create') {
  const send = mode === 'edit' ? 'l’enregistrement' : 'l’envoi'
  if (!result.is_allowed) {
    return {
      tone: 'danger',
      title: mode === 'edit' ? 'Ces changements ne peuvent pas être enregistrés' : 'Cette demande ne peut pas être envoyée en l’état',
      text: 'Modifiez le trajet ou les horaires : la vérification sera relancée.',
    }
  }
  if (result.status === 'en_conflit') {
    return {
      tone: 'warning',
      title: `En conflit dès ${send}`,
      text: 'La demande sera enregistrée, mais la commune devra régler les points ci-dessous avant de la valider.',
    }
  }
  if (result.status === 'approuve') {
    return {
      tone: 'success',
      title: `Approuvée dès ${send}`,
      text: 'Le créneau du bus vous est réservé ; le chauffeur et le véhicule sont ensuite affectés.',
    }
  }
  return {
    tone: 'info',
    title: 'Examinée par la commune',
    text:
      result.warnings?.length > 0
        ? 'Ces horaires demandent une dérogation : la demande sera soumise à la décision du Collège. Vous serez averti de la décision.'
        : 'La demande sera examinée par la commune et soumise à la décision du Collège. Vous serez averti de la décision.',
  }
}
