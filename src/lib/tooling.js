import { addDays, isValidDay } from './planning'

// Onglets de la page Outils (?onglet=), santé par défaut
export const TOOL_TABS = [
  { value: 'sante', label: 'Santé' },
  { value: 'journal', label: 'Journal' },
  { value: 'file', label: 'File d’attente' },
  { value: 'comptes', label: 'Comptes' },
  { value: 'systeme', label: 'Système' },
]
export const DEFAULT_TOOL_TAB = 'sante'

export function readToolTab(searchParams) {
  const tab = searchParams.get('onglet')
  return TOOL_TABS.some((item) => item.value === tab) ? tab : DEFAULT_TOOL_TAB
}

// ----- Santé -----

// Contrôles de GET /toolbox/health, dans l'ordre d'affichage
export const HEALTH_CHECKS = [
  { key: 'database', label: 'Base de données' },
  { key: 'cache', label: 'Cache' },
  { key: 'queue', label: 'File d’attente' },
  { key: 'storage', label: 'Stockage des fichiers' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'mail', label: 'Envoi d’emails (SMTP)' },
  { key: 'ors_geocoding', label: 'Recherche d’adresses (ORS)' },
  { key: 'ors_routing', label: 'Itinéraires (ORS)' },
  { key: 'geonames', label: 'Localités (GeoNames)' },
  { key: 'config', label: 'Configuration' },
]

const STATUS = {
  ok: { tone: 'success', label: 'OK' },
  warn: { tone: 'warning', label: 'À surveiller' },
  alert: { tone: 'warning', label: 'À surveiller' },
}

// Ton et libellé d'un statut de contrôle (toute autre valeur est une panne)
export function checkStatus(status) {
  return STATUS[status] ?? { tone: 'danger', label: 'En panne' }
}

// Contrôles renvoyés par le backend, connus d'abord puis les autres éventuels
export function healthChecks(checks = {}) {
  const known = HEALTH_CHECKS.filter((check) => checks[check.key]).map((check) => ({ ...check, ...checks[check.key] }))
  const others = Object.entries(checks)
    .filter(([key]) => !HEALTH_CHECKS.some((check) => check.key === key))
    .map(([key, check]) => ({ key, label: key, ...check }))
  return [...known, ...others]
}

// Indicateurs de GET /notifications/health
export const NOTIFICATION_METRICS = [
  { key: 'deliveries_pending_total', label: 'Envois en attente' },
  { key: 'deliveries_failed_last_24h', label: 'Envois en échec (24 h)' },
  { key: 'deliveries_high_pending_over_5m', label: 'Prioritaires en attente depuis 5 min' },
  { key: 'digests_pending_ready', label: 'Résumés prêts à partir' },
  { key: 'digests_late_over_30m', label: 'Résumés en retard (30 min)' },
]

// Horodatage du backend sans fuseau ("2026-10-03 17:00:42", en UTC) → ISO UTC pour formatDateTime
export function utcStamp(value) {
  if (!value) return null
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`
}

// ----- Journal -----

export const OUTCOME_FILTERS = [
  { value: null, label: 'Tout' },
  { value: 'success', label: 'Réussies', dot: 'bg-success' },
  { value: 'error', label: 'En erreur', dot: 'bg-danger' },
]

export const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export const JOURNAL_PAGE_SIZE = 25

// Lit les filtres du journal dans l'URL (valeurs inconnues ignorées)
export function readJournalSearch(searchParams) {
  const outcome = searchParams.get('resultat')
  const method = searchParams.get('methode')
  const status = searchParams.get('code')
  const from = searchParams.get('du')
  const to = searchParams.get('au')
  return {
    email: searchParams.get('email') ?? '',
    userId: /^\d+$/.test(searchParams.get('compte') ?? '') ? searchParams.get('compte') : null,
    outcome: ['success', 'error'].includes(outcome) ? outcome : null,
    method: METHODS.includes(method) ? method : null,
    status: /^\d{3}$/.test(status ?? '') ? status : null,
    flow: searchParams.get('flow') || null,
    from: isValidDay(from) ? from : null,
    to: isValidDay(to) ? to : null,
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    openedEntryId: searchParams.get('entree'),
  }
}

// Paramètres de GET /inspector/entries. Dates seules, sans heure ni conversion : le backend les lit comme des
// jours à Bruxelles (`from` dès minuit, `to` jusqu'à la fin de la journée).
export function journalApiParams({ email, userId, outcome, method, status, flow, from, to, page }) {
  return {
    page,
    per_page: JOURNAL_PAGE_SIZE,
    ...(email && { user_email: email }),
    ...(userId && { user_id: Number(userId) }),
    ...(outcome && { outcome }),
    ...(method && { method }),
    ...(status && { http_status: Number(status) }),
    ...(flow && { flow_key: flow }),
    ...(from && { from }),
    ...(to && { to }),
  }
}

// Le journal est-il filtré ? (pour le message de liste vide)
export function isJournalFiltered(search) {
  return Boolean(search.email || search.userId || search.outcome || search.method || search.status || search.flow || search.from || search.to)
}

// Entrées supprimées par une purge « antérieures au jour J » (J exclu) : celles jusqu'à la veille incluse
export function purgeCountParams(before) {
  return before ? { per_page: 1, to: addDays(before, -1) } : { per_page: 1 }
}

// Ton d'un code HTTP
export function httpStatusTone(status) {
  if (status >= 500) return 'danger'
  if (status >= 400) return 'warning'
  return 'success'
}

// Durée lisible : « 214 ms », « 1,2 s »
export function formatDuration(ms) {
  if (ms == null) return ''
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString('fr-BE', { maximumFractionDigits: 1 })} s`
}

// Valeur d'un champ de requête pour l'affichage en libellé / valeur (objets et tableaux en JSON court)
export function displayValue(value) {
  if (value == null) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ----- Système -----

// Permissions regroupées par domaine (préfixe avant le point), dans l'ordre alphabétique
export function permissionGroups(permissions = []) {
  const groups = new Map()
  for (const permission of [...permissions].sort()) {
    const [domain, action] = permission.split('.')
    if (!groups.has(domain)) groups.set(domain, [])
    groups.get(domain).push({ permission, action })
  }
  return [...groups.entries()].map(([domain, items]) => ({ domain, items }))
}

// ----- File d'attente -----

export const QUEUE_FILTERS = [
  { value: null, label: 'Toutes' },
  { value: 'critical', label: 'Critique' },
  { value: 'default', label: 'Normale' },
  { value: 'low', label: 'Basse' },
]

// Lit l'URL de l'onglet File d'attente : file, page et job ouvert (?job=uuid)
export function readQueueSearch(searchParams) {
  const queue = searchParams.get('queue')
  return {
    queue: QUEUE_FILTERS.some((filter) => filter.value && filter.value === queue) ? queue : null,
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    openedUuid: searchParams.get('job'),
  }
}

export function failedJobsApiParams({ queue, page }) {
  return { page, ...(queue && { queue }) }
}

// « App\Notifications\Auth\QueuedResetPassword » → « QueuedResetPassword »
export function shortClassName(name) {
  return (name ?? '').split('\\').pop()
}

// « Espace\Exception: message » → { type: « Exception », message } pour une ligne lisible
export function exceptionParts(summary) {
  const text = summary ?? ''
  const index = text.indexOf(': ')
  if (index === -1) return { type: null, message: text }
  return { type: shortClassName(text.slice(0, index)), message: text.slice(index + 2) }
}
