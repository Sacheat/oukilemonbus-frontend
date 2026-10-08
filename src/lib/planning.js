import { brusselsNow, toLocalMinute } from './dates'

// Vues de la page (?vue=) : la semaine par défaut
export const PLANNING_VIEWS = [
  { value: 'semaine', label: 'Semaine' },
  { value: 'liste', label: 'Liste' },
]
export const DEFAULT_VIEW = 'semaine'

// Statuts affichés : les actifs par défaut, tous si la case « refusés et annulés » est cochée
export const ACTIVE_STATUSES = ['en_attente', 'approuve', 'confirme', 'en_conflit']
export const ALL_STATUSES = [...ACTIVE_STATUSES, 'refuse', 'annule']

// Le backend refuse une période de plus de 31 jours ; la vue liste s'ouvre sur 4 semaines
export const MAX_PERIOD_DAYS = 31
const DEFAULT_LIST_DAYS = 28

// Les jours sont des textes "AAAA-MM-JJ". Pour les calculs, on passe par une date UTC à minuit :
// pas d'heure d'été ni de fuseau qui décalerait le jour.
function toUtcDate(day) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, date))
}

function toDay(utcDate) {
  return utcDate.toISOString().slice(0, 10)
}

export function addDays(day, count) {
  const date = toUtcDate(day)
  date.setUTCDate(date.getUTCDate() + count)
  return toDay(date)
}

// Nombre de jours de `fromDay` à `toDay` inclus (du lundi au vendredi : 5)
export function periodLength(fromDay, toDayValue) {
  return Math.round((toUtcDate(toDayValue) - toUtcDate(fromDay)) / 86_400_000) + 1
}

// Lundi de la semaine qui contient ce jour
export function mondayOf(day) {
  const weekdayFromMonday = (toUtcDate(day).getUTCDay() + 6) % 7 // lundi 0 … dimanche 6
  return addDays(day, -weekdayFromMonday)
}

// Aujourd'hui à Bruxelles, quel que soit le fuseau de l'ordinateur
export function todayInBrussels(now = new Date()) {
  return brusselsNow(now).slice(0, 10)
}

// Un paramètre d'URL est-il une vraie date "AAAA-MM-JJ" ? (sinon on revient à la valeur par défaut)
export function isValidDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && toDay(toUtcDate(value)) === value
}

// Du lundi au vendredi d'une semaine (les trajets n'ont pas lieu le week-end)
export function workingDaysOf(monday) {
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset))
}

// Lit l'URL de la page et complète avec les valeurs par défaut :
//   vue semaine → ?semaine= (un lundi), par défaut la semaine en cours
//   vue liste   → ?du= et ?au=, par défaut 4 semaines à partir du lundi de la semaine en cours
export function readPlanningSearch(searchParams, now = new Date()) {
  const currentMonday = mondayOf(todayInBrussels(now))
  const view = searchParams.get('vue') === 'liste' ? 'liste' : DEFAULT_VIEW
  const weekParam = searchParams.get('semaine')
  const weekStart = isValidDay(weekParam) ? mondayOf(weekParam) : currentMonday
  const fromParam = searchParams.get('du')
  const from = isValidDay(fromParam) ? fromParam : currentMonday
  const toParam = searchParams.get('au')
  const to = isValidDay(toParam) ? toParam : addDays(from, DEFAULT_LIST_DAYS - 1)

  return {
    view,
    weekStart,
    from,
    to,
    showAllStatuses: searchParams.get('statuts') === 'tous',
    vehicleId: searchParams.get('vehicule') ?? '',
    driverId: searchParams.get('chauffeur') ?? '',
    openedTripId: searchParams.get('trajet'),
    dayParam: searchParams.get('jour'),
  }
}

// Jour montré en vue semaine sur petit écran (un jour à la fois, ?jour=) : celui de l'URL s'il est dans la semaine,
// sinon aujourd'hui s'il en fait partie, sinon le lundi
export function shownWeekDay(planningSearch, today) {
  const days = workingDaysOf(planningSearch.weekStart)
  if (days.includes(planningSearch.dayParam)) return planningSearch.dayParam
  return days.includes(today) ? today : days[0]
}

// Période demandée au backend selon la vue : du lundi au vendredi, ou du … au … de la liste
export function requestedPeriod(planningSearch) {
  if (planningSearch.view === 'semaine') {
    return { start: planningSearch.weekStart, end: addDays(planningSearch.weekStart, 4) }
  }
  return { start: planningSearch.from, end: planningSearch.to }
}

// Problème de période à afficher au lieu d'appeler le backend (null si la période est correcte)
export function periodProblem({ start, end }) {
  if (end < start) return 'La date de fin doit être après la date de début.'
  if (periodLength(start, end) > MAX_PERIOD_DAYS) return `La période ne peut pas dépasser ${MAX_PERIOD_DAYS} jours.`
  return null
}

// Ce qui détermine les trajets chargés : période et filtres (sans la vue ni le trajet ouvert).
// Sous forme de texte, pour ne recharger que si l'une de ces valeurs change.
export function planningRequestKey(planningSearch) {
  const { start, end } = requestedPeriod(planningSearch)
  const { showAllStatuses, vehicleId, driverId } = planningSearch
  return JSON.stringify({ start, end, showAllStatuses, vehicleId, driverId })
}

// Paramètres envoyés à GET /planning et à POST /planning/exports (mêmes filtres), à partir de cette clé
export function planningApiParams(requestKey, { withAvailability = false } = {}) {
  const { start, end, showAllStatuses, vehicleId, driverId } = JSON.parse(requestKey)
  return {
    start_date: start,
    end_date: end,
    statuses: showAllStatuses ? ALL_STATUSES : ACTIVE_STATUSES,
    ...(vehicleId && { vehicle_id: Number(vehicleId) }),
    ...(driverId && { driver_id: Number(driverId) }),
    ...(withAvailability && { include_availability: 1 }),
  }
}

// Trajets rangés par jour, dans l'ordre des départs : { "2026-10-22": [trajet, …], … }
export function tripsByDay(tripList) {
  const groups = {}
  const sortedTrips = [...tripList].sort((first, second) =>
    toLocalMinute(first.occupation_start).localeCompare(toLocalMinute(second.occupation_start)),
  )
  sortedTrips.forEach((trip) => {
    groups[trip.trip_date] = [...(groups[trip.trip_date] ?? []), trip]
  })
  return groups
}

// Conflits encore ouverts d'un trajet
export function openConflicts(trip) {
  return (trip.conflicts ?? []).filter((conflict) => !conflict.is_resolved)
}

// Il manque un chauffeur ou un véhicule (sauf pour un trajet refusé ou annulé, où ça n'a plus de sens)
export function needsAssignment(trip) {
  return !trip.is_fully_assigned && !['refuse', 'annule'].includes(trip.status)
}
