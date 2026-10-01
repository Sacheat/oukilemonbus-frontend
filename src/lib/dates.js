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

// LocalDateTime estimé → heure arrondie aux `step` minutes les plus proches : "2026-06-16T10:18:00" → "10:20"
// (une estimation ne doit pas annoncer une précision à la minute)
export function formatApproxTime(value, step = 5) {
  if (!value) return ''
  const date = parseLocal(value)
  date.setMinutes(Math.round(date.getMinutes() / step) * step, 0)
  return new Intl.DateTimeFormat(LOCALE, TIME).format(date)
}

// Plage de LocalDateTime avec le jour : "mercredi 10 juin 2026, de 08:00 à 18:00" le même jour,
// sinon "du 10/06/2026 08:00 au 12/06/2026 17:00"
export function formatLocalPeriod(start, end) {
  if (!start || !end) return ''
  if (start.slice(0, 10) === end.slice(0, 10)) return `${formatDate(start)}, ${formatLocalRange(start, end)}`
  return formatLocalRange(start, end)
}

// LocalDateTime → "AAAA-MM-JJTHH:mm", le format commun pour comparer des heures locales comme du texte.
// L'API renvoie "2026-06-10T08:00:00" (avec secondes), un <input type="datetime-local"> donne "2026-06-10T08:00" :
// sans cette normalisation, "2026-06-10T08:00:00" serait « après » "2026-06-10T08:00" alors que c'est la même heure.
export function toLocalMinute(value) {
  if (!value) return ''
  return value.replace(' ', 'T').slice(0, 16)
}

// Valeur d'un <input type="datetime-local"> ("2026-07-10T08:00") → LocalDateTime pour l'API ("2026-07-10T08:00:00")
export function toLocalApiDateTime(value) {
  if (!value) return ''
  return `${toLocalMinute(value)}:00`
}

// Date → { year, month, day, hour, minute } telle qu'on la lit sur une horloge à Bruxelles
function brusselsParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
}

// Heure actuelle à Bruxelles au format "AAAA-MM-JJTHH:mm", quel que soit le fuseau de l'ordinateur
// (Intl gère l'heure d'été et d'hiver, aucun décalage écrit en dur). Sert à comparer avec des LocalDateTime.
export function brusselsNow(now = new Date()) {
  const { year, month, day, hour, minute } = brusselsParts(now)
  const pad = (n) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
}

// Date → "2026-06-16" pour les envois au backend
export function toApiDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
