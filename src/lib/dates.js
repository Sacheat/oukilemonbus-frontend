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

// Plage d'horodatages UTC, en heure de Bruxelles :
// "mercredi 14 juillet 2027, de 09:00 à 17:00" le même jour, sinon "du 14/07/2027 09:00 au 15/07/2027 17:00"
export function formatUtcRange(start, end) {
  if (!start || !end) return ''
  const dayKey = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(value))
  if (dayKey(start) === dayKey(end)) {
    const day = new Intl.DateTimeFormat(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TIME_ZONE,
    }).format(new Date(start))
    const time = new Intl.DateTimeFormat(LOCALE, { ...TIME, timeZone: TIME_ZONE })
    return `${day}, de ${time.format(new Date(start))} à ${time.format(new Date(end))}`
  }
  return `du ${formatDateTime(start)} au ${formatDateTime(end)}`
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

// Horodatage UTC → "2027-07-14T09:00" (heure de Bruxelles), pour remplir un <input type="datetime-local">
export function toBrusselsInputValue(value) {
  if (!value) return ''
  const { year, month, day, hour, minute } = brusselsParts(new Date(value))
  const pad = (n) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
}

// "2027-07-14T09:00" saisi en heure de Bruxelles → horodatage UTC "2027-07-14T07:00:00.000Z".
// Aucun décalage écrit en dur : Intl donne l'heure de Bruxelles à cet instant (été +2 h, hiver +1 h).
//   1. on lit la saisie comme si c'était de l'UTC
//   2. on mesure l'écart entre cette heure et ce qu'affiche une horloge à Bruxelles au même instant
//   3. on retire cet écart ; un second passage corrige les jours de changement d'heure
export function brusselsInputToUtc(value) {
  if (!value) return ''
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)

  const brusselsOffset = (timestamp) => {
    const clock = brusselsParts(new Date(timestamp))
    return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute) - timestamp
  }
  const firstGuess = wallClockAsUtc - brusselsOffset(wallClockAsUtc)
  return new Date(wallClockAsUtc - brusselsOffset(firstGuess)).toISOString()
}

// Date → "2026-06-16" pour les envois au backend
export function toApiDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
