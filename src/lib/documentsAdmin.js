import { DOCUMENT_TYPE_LABELS } from './labels'
import { formatDate } from './dates'
import { addDays, isValidDay, mondayOf, todayInBrussels } from './planning'

// Types de la page Documents de /gestion (pastilles), dans l'ordre d'affichage. Les justificatifs n'y sont pas :
// ils sont supprimés après la décision et se consultent dans la page Demandes.
export const ADMIN_DOCUMENT_TYPES = ['deliberation', 'feuille_route', 'planning', 'attestation']

export const ADMIN_DOCUMENT_CHIPS = [
  { value: null, label: 'Tous' },
  ...ADMIN_DOCUMENT_TYPES.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] })),
]

// Lit l'URL de la page : recherche, type, période (?du= & ?au=), page et document ouvert (valeurs inconnues ignorées)
export function readDocumentsSearch(searchParams) {
  const type = searchParams.get('type')
  const from = searchParams.get('du')
  const to = searchParams.get('au')
  return {
    search: searchParams.get('q') ?? '',
    type: ADMIN_DOCUMENT_TYPES.includes(type) ? type : null,
    from: isValidDay(from) ? from : null,
    to: isValidDay(to) ? to : null,
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    openedId: searchParams.get('document') || null,
  }
}

// Paramètres de GET /documents : le type choisi, sinon tous les types de la page (sans justificatifs)
export function documentsApiParams({ search, type, from, to, page }) {
  return {
    page,
    document_type: type ? [type] : ADMIN_DOCUMENT_TYPES,
    ...(search && { q: search }),
    ...(from && { date_from: from }),
    ...(to && { date_to: to }),
  }
}

// Paramètres communs aux compteurs des pastilles : recherche et période, sans le type ni la page
export function documentsCountParams({ search, from, to }) {
  return {
    ...(search && { q: search }),
    ...(from && { date_from: from }),
    ...(to && { date_to: to }),
  }
}

// Message quand le début de la période dépasse la fin
export function documentsPeriodProblem({ from, to }) {
  return from && to && from > to ? 'Le début de la période doit précéder sa fin.' : null
}

// Valeurs de départ de la fenêtre « Générer une feuille de route » : demain (la génération automatique de 20:00
// prépare déjà le lendemain)
export function routeSheetFormValues(now = new Date()) {
  const tomorrow = addDays(todayInBrussels(now), 1)
  return { mode: 'jour', service_date: tomorrow, vehicle_id: '', start_date: tomorrow, end_date: tomorrow }
}

// Corps de POST /documents/route-sheets/generate selon le mode (un jour et un véhicule, ou une période)
export function routeSheetBody(values) {
  if (values.mode === 'jour') return { service_date: values.service_date, vehicle_id: Number(values.vehicle_id) }
  return { start_date: values.start_date, end_date: values.end_date }
}

// Message après la génération
export function routeSheetNotice(document) {
  return document.version > 1
    ? `Feuille de route générée (version ${document.version}) : ${document.file_name}.`
    : `Feuille de route générée : ${document.file_name}.`
}

// Titre d'une ligne : « Feuille de route · 12 oct. · AB-123-CD » (date et plaque si le backend les donne),
// « Délibération · motif du trajet », sinon le type seul
export function documentTitle(doc) {
  const type = doc.document_type_label ?? DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type
  const parts = [type]
  if (doc.document_type === 'feuille_route') {
    if (doc.service_date) parts.push(formatDate(doc.service_date, { day: 'numeric', month: 'short' }))
    if (doc.vehicle?.licence_plate) parts.push(doc.vehicle.licence_plate)
  } else if (doc.document_type === 'deliberation' && doc.reservation?.trip_purpose) {
    parts.push(doc.reservation.trip_purpose)
  }
  return parts.join(' · ')
}

// Raccourcis de période (?du= & ?au=) : aujourd'hui, semaine en cours (lundi → dimanche) et mois en cours
export function periodShortcuts(now = new Date()) {
  const today = todayInBrussels(now)
  const monday = mondayOf(today)
  const monthStart = `${today.slice(0, 7)}-01`
  const nextMonthStart = addDays(`${today.slice(0, 7)}-28`, 4).slice(0, 7) + '-01'
  return [
    { value: 'aujourdhui', label: "Aujourd'hui", from: today, to: today },
    { value: 'semaine', label: 'Cette semaine', from: monday, to: addDays(monday, 6) },
    { value: 'mois', label: 'Ce mois', from: monthStart, to: addDays(nextMonthStart, -1) },
  ]
}

// Pastille de période active : un raccourci, « autre » (dates libres ou choisies) ou null (toutes les dates)
export function activePeriod({ from, to, custom }, now = new Date()) {
  const shortcut = periodShortcuts(now).find((item) => item.from === from && item.to === to)
  if (shortcut) return shortcut.value
  return from || to || custom ? 'autre' : null
}
