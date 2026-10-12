import { DOCUMENT_TYPE_LABELS } from './labels'
import { formatDate, formatDateTime } from './dates'
import { planningDayLink } from './dashboard'
import { DECISION_STATUS } from './documents'
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
  const version = document.version > 1 ? ` (version ${document.version})` : ''
  return `${documentTitle(document)} générée${version}.`
}

const SHORT_DAY = { day: 'numeric', month: 'short' }

// Planning : export Excel lancé depuis la page Planning (fichier de travail), sinon planning hebdomadaire officiel
export function isPlanningExport(doc) {
  return doc.document_type === 'planning' && (doc.generation_context?.planning_export_request_id != null || doc.generation_mode === 'async')
}

// Période couverte par un document, lue dans `generation_context` (renvoyé aux agents et admins), sinon null :
// planning hebdomadaire (lundi → dimanche), export du planning, feuille de route d'une période
export function documentPeriod(doc) {
  const context = doc.generation_context ?? {}
  if (doc.document_type === 'planning') {
    const monday = context.week_start ?? (isPlanningExport(doc) ? null : doc.service_date)
    if (isValidDay(monday)) return { from: monday, to: addDays(monday, 6) }
    if (isValidDay(context.start_date) && isValidDay(context.end_date)) return { from: context.start_date, to: context.end_date }
  }
  if (doc.document_type === 'feuille_route' && !doc.service_date) {
    const period = context.period ?? context
    if (isValidDay(period.start_date) && isValidDay(period.end_date)) return { from: period.start_date, to: period.end_date }
  }
  return null
}

// « 5 → 9 oct. », « 28 sept. → 3 oct. », un seul jour : « 9 oct. »
export function formatDayRange({ from, to }) {
  if (from === to) return formatDate(from, SHORT_DAY)
  const start = from.slice(0, 7) === to.slice(0, 7) ? formatDate(from, { day: 'numeric' }) : formatDate(from, SHORT_DAY)
  return `${start} → ${formatDate(to, SHORT_DAY)}`
}

// Titre d'un document (ligne et panneau) : « Feuille de route · 9 oct. · AB-123-CD » ou « Feuille de route · 5 → 9 oct. »,
// « Planning de la semaine du 12 oct. », « Export du planning · 5 → 9 oct. », « Délibération · motif du trajet » ;
// le type seul quand le backend ne donne pas de quoi préciser
export function documentTitle(doc) {
  const type = doc.document_type_label ?? DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type
  const period = documentPeriod(doc)
  if (doc.document_type === 'planning') {
    if (isPlanningExport(doc)) return period ? `Export du planning · ${formatDayRange(period)}` : 'Export du planning'
    return period ? `Planning de la semaine du ${formatDate(period.from, SHORT_DAY)}` : type
  }
  const parts = [type]
  if (doc.document_type === 'feuille_route') {
    if (doc.service_date) parts.push(formatDate(doc.service_date, SHORT_DAY))
    else if (period) parts.push(formatDayRange(period))
    if (doc.vehicle?.licence_plate) parts.push(doc.vehicle.licence_plate)
  } else if (doc.document_type === 'deliberation' && doc.reservation?.trip_purpose) {
    parts.push(doc.reservation.trip_purpose)
  }
  return parts.join(' · ')
}

// Décision du Collège d'une délibération, lue dans `generation_context` : { label, tone } ou null
export function deliberationDecision(doc) {
  if (doc.document_type !== 'deliberation') return null
  const decision = doc.generation_context?.decision
  const known = DECISION_STATUS[decision?.status]
  return known ? { ...known, label: decision.status_label ?? known.label } : null
}

// Sous-titre d'une ligne : « créé le 8 oct. 2026 à 16:51 · par Prénom Nom » (auteur seulement s'il est connu)
export function documentSubtitle(doc) {
  const created = `créé le ${formatDateTime(doc.generated_at ?? doc.created_at)}`
  return doc.user?.full_name ? `${created} · par ${doc.user.full_name}` : created
}

// Lien du panneau vers l'endroit où agir, selon le type et la permission de la page visée, sinon null :
// délibération → la réservation dans la file ; feuille de route → le Planning du jour ; planning hebdomadaire →
// le Planning de la semaine
export function documentLink(doc, can) {
  if (doc.document_type === 'deliberation' && doc.reservation_id && can('reservations.approve')) {
    return { to: `/gestion/reservations?reservation=${doc.reservation_id}`, label: 'Voir la réservation' }
  }
  if (!can('reservations.view')) return null
  if (doc.document_type === 'feuille_route' && doc.service_date) {
    return { to: planningDayLink(doc.service_date), label: 'Voir le Planning du jour' }
  }
  const period = documentPeriod(doc)
  if (doc.document_type === 'planning' && !isPlanningExport(doc) && period) {
    return { to: `/gestion/planning?semaine=${period.from}`, label: 'Voir le Planning de la semaine' }
  }
  return null
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
