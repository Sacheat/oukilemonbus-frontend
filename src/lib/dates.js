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

const DATE_TIME = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
const TIME = { hour: '2-digit', minute: '2-digit' }

// Horodatage UTC → "16/06/2026 11:00" en heure de Bruxelles
export function formatDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, { ...DATE_TIME, timeZone: TIME_ZONE }).format(new Date(value))
}

// Horodatage UTC → "16/06/2026" (jour à Bruxelles)
export function formatDay(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TIME_ZONE }).format(
    new Date(value),
  )
}

// Horodatage UTC → date relative : « à l'instant », « il y a 5 min », « il y a 3 h »,
// « hier à 14:05 », puis la date complète au-delà
export function formatRelative(value, now = new Date()) {
  if (!value) return ''
  const date = new Date(value)
  const minutes = Math.floor((now - date) / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const day = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(d) // AAAA-MM-JJ à Bruxelles
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (day(date) === day(now)) return `il y a ${Math.floor(minutes / 60)} h`
  const time = new Intl.DateTimeFormat(LOCALE, { ...TIME, timeZone: TIME_ZONE }).format(date)
  if (day(date) === day(yesterday)) return `hier à ${time}`
  return formatDateTime(value)
}

// LocalDateTime sans fuseau → "16/06/2026 09:00"
export function formatLocalDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, DATE_TIME).format(parseLocal(value))
}

// Plage de LocalDateTime : "de 09:00 à 12:20" le même jour, sinon dates complètes
export function formatLocalRange(start, end) {
  if (!start || !end) return ''
  if (start.slice(0, 10) === end.slice(0, 10)) {
    const time = new Intl.DateTimeFormat(LOCALE, TIME)
    return `de ${time.format(parseLocal(start))} à ${time.format(parseLocal(end))}`
  }
  return `du ${formatLocalDateTime(start)} au ${formatLocalDateTime(end)}`
}

// Date → "2026-06-16" pour les envois au backend
export function toApiDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
