import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS } from './labels'

// Files de la page Demandes (?file=), adhésions par défaut. `kind` : nom utilisé par l'API (api/requests.js).
export const REQUEST_QUEUES = [
  { value: 'adhesions', kind: 'adhesion', label: 'Adhésions' },
  { value: 'organisations', kind: 'creation', label: 'Nouvelles organisations' },
]
export const DEFAULT_REQUEST_QUEUE = 'adhesions'

// Statuts affichés (?statut=), « à traiter » par défaut ; `sort` : à traiter dans l'ordre d'arrivée, sinon les plus
// récentes d'abord
export const REQUEST_STATUS_TABS = [
  { value: 'a-traiter', label: 'À traiter', statuses: ['en_attente'], sort: 'anciennete' },
  { value: 'approuvees', label: 'Approuvées', statuses: ['approuve'], sort: 'recentes' },
  { value: 'refusees', label: 'Refusées', statuses: ['refuse'], sort: 'recentes' },
  { value: 'toutes', label: 'Toutes', statuses: null, sort: 'recentes' },
]
export const DEFAULT_REQUEST_STATUS = 'a-traiter'

// Tris proposés (?tri=) ; sans choix, celui de l'onglet de statut
export const REQUEST_SORTS = [
  { value: 'anciennete', label: 'Plus anciennes d’abord' },
  { value: 'recentes', label: 'Plus récentes d’abord' },
  { value: 'confiance', label: 'Confiance la plus haute' },
]

export function queueOfRequests(value) {
  return REQUEST_QUEUES.find((queue) => queue.value === value) ?? REQUEST_QUEUES[0]
}

export function statusTabOf(value) {
  return REQUEST_STATUS_TABS.find((tab) => tab.value === value) ?? REQUEST_STATUS_TABS[0]
}

// Lit l'URL de la page : file, statut, tri, type d'organisation (nouvelles organisations seulement), recherche, page
// et demande ouverte (?demande=id)
export function readRequestsSearch(searchParams) {
  const queue = queueOfRequests(searchParams.get('file'))
  const status = statusTabOf(searchParams.get('statut'))
  const sort = searchParams.get('tri')
  const type = searchParams.get('type')
  return {
    queue,
    status,
    sort: REQUEST_SORTS.some((item) => item.value === sort) ? sort : status.sort,
    type: queue.kind === 'creation' && type in ORGANIZATION_TYPE_LABELS ? type : '',
    search: searchParams.get('q') ?? '',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    openedId: /^\d+$/.test(searchParams.get('demande') ?? '') ? searchParams.get('demande') : null,
  }
}

// Paramètres de la liste (filtrée et triée par le backend)
export function requestsApiParams({ status, sort, type, search, page }) {
  return {
    page,
    sort,
    ...(status.statuses && { statuses: status.statuses }),
    ...(type && { organization_type: type }),
    ...(search && { q: search }),
  }
}

// Identifiant d'une demande : `request_id` pour une adhésion, `id` pour une création
export function requestIdOf(kind, request) {
  return kind === 'adhesion' ? request.request_id : request.id
}

// Ce que décrit une ligne : titre (organisation visée ou demandée), détail (rôle demandé ou type) et demandeur
export function requestSummary(kind, request) {
  if (kind === 'adhesion') {
    return {
      title: request.organization?.name ?? 'Organisation inconnue',
      detail: `Rôle demandé : ${RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role}`,
      requester: request.requested_by_user,
    }
  }
  return {
    title: request.organization_name,
    detail: request.organization_type_label ?? ORGANIZATION_TYPE_LABELS[request.organization_type] ?? request.organization_type,
    requester: request.requested_by_user,
  }
}

// Ton de la pastille selon le niveau calculé par le backend (`confidence_level`, adhésions et nouvelles
// organisations) ; sans niveau : neutre (les seuils ne sont pas recodés dans le front)
export const CONFIDENCE_LEVEL_TONES = { faible: 'danger', moyen: 'warning', eleve: 'success' }

// Avertissement « Rôle déjà tenu » d'une adhésion (l'organisation a déjà un responsable ou directeur : approuver en
// ajouterait un second), reconnu au début de son texte faute de code dans l'API ; null s'il n'y en a pas
const ROLE_ALREADY_HELD = /^rôle déjà tenu/i

export function roleAlreadyHeldWarning(warnings) {
  return warnings?.find((warning) => ROLE_ALREADY_HELD.test(warning)) ?? null
}

// Tons des statuts (comme les badges de l'espace usager)
export const REQUEST_STATUS_TONES = { en_attente: 'warning', approuve: 'success', refuse: 'danger' }

// Ce que fera l'approbation, annoncé dans la fenêtre de confirmation
export function approvalEffect(kind, request) {
  const name = request.requested_by_user?.full_name ?? 'Le demandeur'
  if (kind === 'adhesion') {
    const role = RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role
    return `${name} rejoindra ${request.organization?.name ?? 'l’organisation'} avec le rôle « ${role} ». Si c’est sa première organisation, elle deviendra son organisation par défaut. Une notification lui sera envoyée.`
  }
  const type = request.organization_type_label ?? ORGANIZATION_TYPE_LABELS[request.organization_type]
  return `L’organisation « ${request.organization_name} » (${type}) sera créée et ${name} en deviendra responsable. Une notification lui sera envoyée et le justificatif sera supprimé.`
}

// Une demande à traiter qui attend depuis plus de STALE_REQUEST_DAYS jours est signalée dans la liste (bordure et
// « En attente depuis N jours ») : le tri par défaut (plus anciennes d'abord) la met déjà en tête.
export const STALE_REQUEST_DAYS = 7

// Nombre de jours d'attente d'une demande encore en attente, s'il dépasse le seuil ; null sinon
export function staleDays(request, now = new Date()) {
  if (request.status !== 'en_attente' || !request.created_at) return null
  const days = Math.floor((now - new Date(request.created_at)) / 86_400_000)
  return days > STALE_REQUEST_DAYS ? days : null
}
