import { addDays, isValidDay, mondayOf, todayInBrussels } from './planning'

// Lit l'URL de la page Feuilles de route : ?semaine= (n'importe quel jour, ramené au lundi ; par défaut la semaine
// en cours) et ?page= (feuilles officielles)
export function readRouteSheetsSearch(searchParams, now = new Date()) {
  const weekParam = searchParams.get('semaine')
  const page = Number(searchParams.get('page'))
  return {
    weekStart: mondayOf(isValidDay(weekParam) ? weekParam : todayInBrussels(now)),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

// Dimanche de la semaine (le backend couvre lundi → dimanche ; le week-end seulement s'il y a des missions)
export function weekEndOf(weekStart) {
  return addDays(weekStart, 6)
}

// Missions de la semaine qui figurent sur la feuille : confirmées seulement, comme le PDF ; compte rendu joint (badges)
export function weekMissionsParams(weekStart) {
  return { date_from: weekStart, date_to: weekEndOf(weekStart), statuses: ['confirme'], sort: 'asc', include: 'trip_report' }
}

// Nom du PDF enregistré (le backend en propose un, mais le header n'est pas lisible depuis le navigateur)
export function weekSheetFileName(weekStart) {
  return `feuille-de-route-semaine-${weekStart}.pdf`
}

// « 3 trajets, dont 1 pour vous » (own_trip_count absent pour un agent)
export function sheetTripsText(sheet) {
  const total = `${sheet.trip_count} trajet${sheet.trip_count > 1 ? 's' : ''}`
  if (sheet.own_trip_count == null) return total
  return `${total}, dont ${sheet.own_trip_count} pour vous`
}
