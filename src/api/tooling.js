import { api } from './client'

// Module Tooling du backend (admin, permission tooling.access), sous /admin/tooling. Lecture seule, sauf la purge.
const BASE = '/admin/tooling'

async function read(path, { params, signal } = {}) {
  const { data } = await api.get(`${BASE}${path}`, { params, signal })
  return data
}

// Santé du système : { healthy, checks: { database, cache, queue, storage, ors_geocoding, ors_routing, geonames,
// notifications, config } }, chaque contrôle { status: ok|warn|error, details, duration_ms }. Lent (APIs externes),
// 10 appels par minute au plus.
export async function getSystemHealth({ signal } = {}) {
  return (await read('/toolbox/health', { signal })).data
}

// Envois d'emails en arrière-plan : { status: ok|alert, data: { deliveries_pending_total, … } }
export async function getNotificationsHealth({ signal } = {}) {
  const { data } = await api.get('/notifications/health', { signal })
  return data
}

// État de l'Inspector : enabled, retention_days, entries_count, oldest_entry_at, latest_entry_at, flows_count
export async function getInspectorStatus({ signal } = {}) {
  return (await read('/inspector/status', { signal })).data
}

// Journal des requêtes qui modifient des données, paginé, plus récentes d'abord. Filtres : user_id, user_email,
// flow_key, route_name, method, outcome (success|error), http_status, from, to, per_page (1–100, défaut 25).
// `from` / `to` en dates seules AAAA-MM-JJ : jours à Bruxelles, `to` inclut toute la journée.
export async function getInspectorEntries(params, { signal } = {}) {
  return read('/inspector/entries', { params, signal })
}

// Une entrée avec la fiche complète de son flow
export async function getInspectorEntry(entryId, { signal } = {}) {
  return (await read(`/inspector/entries/${entryId}`, { signal })).data
}

// Purge définitive : toutes les entrées, ou celles antérieures au jour `before` (Bruxelles, ce jour exclu) → nombre supprimé
export async function purgeInspectorEntries(before) {
  const { data } = await api.delete(`${BASE}/inspector/entries`, { data: before ? { before } : {} })
  return data.data.deleted
}

// Catalogue des flows : { flows: { clé: fiche }, route_map }
export async function getInspectorFlows({ signal } = {}) {
  return (await read('/inspector/flows', { signal })).data
}

// Fiche de diagnostic d'un compte : rôles, permissions effectives, capacités, organisation, statistiques du journal
export async function getInspectorUser(userId, { signal } = {}) {
  return (await read(`/inspector/users/${userId}`, { signal })).data
}

// Vue d'ensemble : db_stats, business_rules, architecture
export async function getToolboxOverview({ signal } = {}) {
  return (await read('/toolbox/overview', { signal })).data
}

// Matrice : { roles, permissions, matrix: { rôle: [permissions] } }
export async function getPermissionMatrix({ signal } = {}) {
  return (await read('/toolbox/permissions', { signal })).data
}

// Routes internes par domaine ({ méthode, uri, permission }) et APIs externes (nom, URL, usage, repli)
export async function getApiCatalog({ signal } = {}) {
  return (await read('/toolbox/api-catalog', { signal })).data
}

// ----- Jobs en échec de la file d'attente -----

// Liste paginée (15 par défaut), plus récents d'abord : id, uuid, queue, connection, job (classe complète),
// exception_summary, failed_at (ISO UTC). Filtres : queue (critical|default|low), per_page (1–100), page.
export async function getFailedJobs(params, { signal } = {}) {
  return read('/queue/failed-jobs', { params, signal })
}

// Détail : exception complète et payload expurgé ; 404 si le job n'existe plus
export async function getFailedJob(uuid, { signal } = {}) {
  return (await read(`/queue/failed-jobs/${uuid}`, { signal })).data
}

// Remet le job dans la file (202) → nombre relancé ; s'il échoue encore, il revient dans la liste
export async function retryFailedJob(uuid) {
  const { data } = await api.post(`${BASE}/queue/failed-jobs/${uuid}/retry`)
  return data.data.retried
}

export async function retryAllFailedJobs() {
  const { data } = await api.post(`${BASE}/queue/failed-jobs/retry`)
  return data.data.retried
}

export async function deleteFailedJob(uuid) {
  const { data } = await api.delete(`${BASE}/queue/failed-jobs/${uuid}`)
  return data.data.deleted
}

// Suppression groupée : tout, ou les jobs d'avant `before` (jour à Bruxelles, ce jour-là exclu)
export async function deleteFailedJobs(before) {
  const { data } = await api.delete(`${BASE}/queue/failed-jobs`, { data: before ? { before } : {} })
  return data.data.deleted
}
