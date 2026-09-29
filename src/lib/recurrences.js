import { RECURRENCE_FREQUENCY_LABELS } from './labels'
import { EMPTY_RESERVATION, mapApiErrors } from './reservationForm'
import { isTerminal, todayApiDate } from './reservations'

// 1 = lundi … 5 = vendredi (pas de récurrence le week-end)
export const WEEK_DAYS = [
  { value: 1, label: 'lundi', short: 'Lun' },
  { value: 2, label: 'mardi', short: 'Mar' },
  { value: 3, label: 'mercredi', short: 'Mer' },
  { value: 4, label: 'jeudi', short: 'Jeu' },
  { value: 5, label: 'vendredi', short: 'Ven' },
]

function joinFrench(items) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

function dayLabels(days, plural) {
  return days
    .slice()
    .sort()
    .map((day) => WEEK_DAYS.find((item) => item.value === Number(day))?.label + (plural ? 's' : ''))
}

// « Tous les mardis et jeudis », « Toutes les deux semaines, le mardi », « Chaque mois, le 19 »
export function describeFrequency({ frequency, days_of_week: days, start_date: startDate }) {
  if (frequency === 'mensuel') {
    return startDate ? `Chaque mois, le ${Number(startDate.slice(8, 10))}` : 'Chaque mois'
  }
  if (!days?.length) return RECURRENCE_FREQUENCY_LABELS[frequency] ?? frequency
  if (frequency === 'bihebdomadaire') return `Toutes les deux semaines, le ${joinFrench(dayLabels(days, false))}`
  return `Tous les ${joinFrench(dayLabels(days, true))}`
}

// Les récurrences sont réservées aux écoles et au personnel communal
export const RECURRENCE_ORGANIZATION_TYPES = ['ecole_communale', 'personnel_communal']

export function recurrenceOrganizations(user) {
  return (user?.organizations ?? []).filter((organization) => RECURRENCE_ORGANIZATION_TYPES.includes(organization.type))
}

// Active, terminée (date de fin passée) ou arrêtée
export function recurrenceState(recurrence) {
  if (!recurrence.is_active) return { tone: 'neutral', label: 'Arrêtée' }
  if (recurrence.end_date < todayApiDate()) return { tone: 'neutral', label: 'Terminée' }
  return { tone: 'success', label: 'Active' }
}

// Occurrences que « Annuler la série » annulera : à partir d'aujourd'hui, ni refusées ni annulées
export function cancellableOccurrences(reservations = []) {
  const today = todayApiDate()
  return reservations.filter((reservation) => reservation.trip_date >= today && !isTerminal(reservation))
}

// ----- Assistant de création -----

export const EMPTY_RECURRENCE = {
  ...EMPTY_RESERVATION,
  frequency: 'hebdomadaire',
  days_of_week: [],
  start_date: '',
  end_date: '',
}

export const RECURRENCE_STEP_FIELDS = {
  1: ['organization_id', 'departure_time', 'return_time', 'pickup', 'destination'],
  2: ['frequency', 'days_of_week', 'start_date', 'end_date'],
  3: ['nb_children', 'nb_adults', 'activity_type', 'trip_purpose'],
}

export function recurrenceStepOfField(field) {
  const base = field.split('.')[0] // days_of_week.0 → days_of_week
  return Number(Object.keys(RECURRENCE_STEP_FIELDS).find((step) => RECURRENCE_STEP_FIELDS[step].includes(base))) || null
}

// Erreurs du backend → champs du formulaire (days_of_week.0 → days_of_week)
export function mapRecurrenceErrors(apiErrors) {
  const mapped = mapApiErrors(apiErrors)
  return Object.fromEntries(Object.entries(mapped).map(([field, message]) => [field.split('.')[0], message]))
}

export function missingRecurrenceFields(values, step) {
  const errors = {}
  for (const field of RECURRENCE_STEP_FIELDS[step]) {
    if (field === 'days_of_week') {
      if (values.frequency !== 'mensuel' && values.days_of_week.length === 0) errors.days_of_week = 'Choisissez au moins un jour.'
    } else if (values[field] === '' || values[field] === null) {
      errors[field] = 'Ce champ est obligatoire.'
    }
  }
  return errors
}

// Corps de preview / création. `passengers` : false pour le preview en direct de l'étape 2,
// qui n'a pas encore les passagers (valeurs provisoires, la vérification finale utilise les vraies).
export function toRecurrencePayload(values, { passengers = true } = {}) {
  const payload = {
    organization_id: Number(values.organization_id),
    pickup_location_id: values.pickup?.id,
    destination_location_id: values.destination?.id,
    departure_time: values.departure_time,
    return_time: values.return_time,
    activity_type: values.activity_type,
    frequency: values.frequency,
    start_date: values.start_date,
    end_date: values.end_date,
    nb_children: passengers ? Number(values.nb_children || 0) : 0,
    nb_adults: passengers ? Number(values.nb_adults) : 1,
    trip_purpose: passengers ? values.trip_purpose.trim() : 'Vérification du calendrier',
  }
  if (values.frequency !== 'mensuel') payload.days_of_week = values.days_of_week.map(Number).sort()
  return payload
}

// Preview en direct possible dès que le trajet et le calendrier sont complets
export function recurrenceCalendarPayload(values) {
  const ready =
    values.organization_id && values.pickup && values.destination && values.departure_time && values.return_time &&
    values.start_date && values.end_date && (values.frequency === 'mensuel' || values.days_of_week.length > 0)
  return ready ? toRecurrencePayload(values, { passengers: false }) : null
}
