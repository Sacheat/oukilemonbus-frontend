// Formats reçus du backend (voir « Conventions » du guide API) :
// - dates simples "2026-06-16" et heures "09:00:00" : heure locale, sans fuseau
// - horodatages ISO 8601 en UTC ("…Z") : à afficher en heure de Bruxelles
// - LocalDateTime "2026-06-16T09:00:00" (estimated_occupation) : déjà en heure locale,
//   ne pas les convertir depuis l'UTC
const TIME_ZONE = 'Europe/Brussels'
const LOCALE = 'fr-BE'

// "2026-06-16" ou "2026-06-16T09:00:00" (sans fuseau) → Date locale, sans décalage UTC
function parseLocal(value) {
  const [datePart, timePart = '00:00:00'] = value.split(/[T ]/)
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

// "2026-06-16" → "mardi 16 juin 2026"
export function formatDate(value, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, options).format(parseLocal(value))
}

// "2026-06-16" → { day: "16", month: "JUIN" } pour la pastille de date de la DA
export function dateBadgeParts(value) {
  const date = parseLocal(value)
  return {
    day: String(date.getDate()),
    month: new Intl.DateTimeFormat(LOCALE, { month: 'short' }).format(date).toUpperCase(),
  }
}

// "09:00:00" → "09:00"
export function formatTime(value) {
  return value ? value.slice(0, 5) : ''
}

// Horodatage UTC → "16/06/2026 11:00" en heure de Bruxelles
export function formatDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: TIME_ZONE,
  }).format(new Date(value))
}

// LocalDateTime sans fuseau → "16/06/2026 09:00"
export function formatLocalDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'short' }).format(parseLocal(value))
}

// Date → "2026-06-16" pour les envois au backend
export function toApiDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
