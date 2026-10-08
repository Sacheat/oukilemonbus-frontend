// Demandes d'aide des chauffeurs, côté agent (/gestion/alertes)
import { formatRelative } from './dates'

// Filtres de la liste (?statut=) : en cours par défaut (ouvertes et prises en charge), clôturées, toutes
export const ALERT_FILTERS = [
  { value: 'en-cours', label: 'En cours', statuses: ['ouverte', 'prise_en_charge'] },
  { value: 'cloturees', label: 'Clôturées', statuses: ['cloturee'] },
  { value: 'toutes', label: 'Toutes', statuses: [] },
]
export const DEFAULT_ALERT_FILTER = 'en-cours'

export function readAlertSearch(searchParams) {
  const filter = ALERT_FILTERS.find((option) => option.value === searchParams.get('statut')) ?? ALERT_FILTERS[0]
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  return { filter: filter.value, statuses: filter.statuses, page }
}

// Ton de la pastille du statut
export const ALERT_STATUS_TONES = { ouverte: 'danger', prise_en_charge: 'warning', cloturee: 'neutral' }

// Lieu de l'alerte en une ligne : précision de la position, ou dernier lieu connu
export function alertPlaceText(alert) {
  if (alert.position.latitude != null) {
    return alert.position.accuracy_m ? `Position envoyée, à ${alert.position.accuracy_m} m près` : 'Position envoyée'
  }
  return alert.fallback_location
    ? `${alert.position.state_label} · dernier lieu connu : ${alert.fallback_location.label}`
    : alert.position.state_label
}

// Lien téléphone (sans espaces)
export function telHref(phone) {
  return `tel:${String(phone).replace(/\s+/g, '')}`
}

// Délai de la relance automatique d'une demande que personne ne prend en charge (backend : 10 min)
export const ALERT_REMINDER_MINUTES = 10

// Minutes écoulées depuis un horodatage UTC (ISO), à l'instant `now` (Date)
export function minutesSince(isoDate, now) {
  return Math.max(0, Math.floor((now - new Date(isoDate)) / 60_000))
}

// « moins d'une minute », « 38 min », « 1 h 05 »
export function durationText(minutes) {
  if (minutes < 1) return 'moins d’une minute'
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return `${Math.floor(minutes / 60)} h${rest ? ` ${String(rest).padStart(2, '0')}` : ''}`
}

// Depuis quand la demande attend, en direct : { text, urgent, strong }.
//   ouverte (personne ne s'en occupe) → « Sans réponse depuis 38 min », urgent, en gras dès le délai de relance ;
//   sinon                             → « il y a 2 h », « hier à 19:00 »… (formatRelative)
export function alertWaitingText(alert, now) {
  if (alert.status === 'ouverte') {
    const minutes = minutesSince(alert.created_at, now)
    return { text: `Sans réponse depuis ${durationText(minutes)}`, urgent: true, strong: minutes >= ALERT_REMINDER_MINUTES }
  }
  return { text: formatRelative(alert.created_at, now), urgent: false, strong: false }
}
