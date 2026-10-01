import { fetchAllPages } from '../api/pagination'
import { getReservations } from '../api/reservations'
import { todayApiDate, tripKey, yesterdayApiDate } from './reservations'

// Files de la page « Réservations » de l'espace gestion, dans l'ordre des pastilles.
// `statuses` : statuts affichés (null : tous) ; la valeur est gardée dans l'URL (?file=…).
export const QUEUES = [
  { value: 'a-traiter', label: 'À traiter', statuses: ['en_attente', 'en_conflit'] },
  { value: 'en-attente', label: 'En attente', statuses: ['en_attente'], dot: 'bg-warning' },
  { value: 'en-conflit', label: 'En conflit', statuses: ['en_conflit'], dot: 'bg-conflict' },
  { value: 'a-affecter', label: 'À affecter', statuses: ['approuve'], dot: 'bg-info' },
  { value: 'confirmees', label: 'Confirmées', statuses: ['confirme'], dot: 'bg-success' },
]
export const DEFAULT_QUEUE = 'a-traiter'

export function queueOf(value) {
  return QUEUES.find((queue) => queue.value === value) ?? QUEUES[0]
}

// Période (?periode=…) : à venir par défaut (trajet le plus proche d'abord), passés (le plus récent d'abord)
export const PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
]

export function periodParams(period) {
  return period === 'passes' ? { date_to: yesterdayApiDate(), sort: 'desc' } : { date_from: todayApiDate(), sort: 'asc' }
}

// Ordre de traitement : par date et heure de départ (croissant, ou décroissant pour les trajets passés)
export function sortQueue(reservations, direction = 'asc') {
  const sorted = [...reservations].sort((a, b) => tripKey(a).localeCompare(tripKey(b)) || a.id - b.id)
  return direction === 'desc' ? sorted.reverse() : sorted
}

// Réservation à ouvrir après une action sur `currentId` : la suivante dans la file (ou la précédente
// si c'était la dernière). `list` : la file telle qu'affichée avant l'action. null si la file se vide.
export function nextInQueue(list, currentId) {
  const index = list.findIndex((reservation) => reservation.id === currentId)
  if (index === -1) return list[0]?.id ?? null
  const next = list[index + 1] ?? list[index - 1]
  return next?.id ?? null
}

// Actions possibles d'un agent sur une réservation, selon son statut (le backend reste l'autorité).
// Validation manuelle (ASBL, CPAS, externes) : l'approbation exige une décision favorable du Collège
// (`decision` : décision de la réservation, ou null) ; `approveBlocked` signale ce cas pour l'expliquer.
export function agentActions(reservation, can, decision = null) {
  const { status } = reservation
  const terminal = status === 'refuse' || status === 'annule'
  const assigned = Boolean(reservation.driver_id && reservation.vehicle_id)
  const openConflicts = (reservation.conflicts ?? []).some((conflict) => !conflict.is_resolved)
  const needsCouncil = reservation.approval_type === 'manuel'
  const councilOk = decision?.decision_status === 'approuve'
  const approvable = can('reservations.approve') && ['en_attente', 'en_conflit'].includes(status)
  return {
    approve: approvable && (!needsCouncil || councilOk),
    approveBlocked: approvable && needsCouncil && !councilOk,
    council: can('council-decisions.create') && needsCouncil && !terminal,
    reject: can('reservations.reject') && ['en_attente', 'en_conflit', 'approuve'].includes(status),
    assign: can('reservations.assign') && !terminal,
    retryAssign: can('reservations.assign') && !terminal && !assigned,
    confirm: can('reservations.confirm') && status === 'approuve' && assigned && !openConflicts,
    cancel: can('reservations.cancel') && ['en_attente', 'en_conflit', 'approuve', 'confirme'].includes(status),
    resolveConflicts: can('reservations.manage-conflicts') && !terminal,
  }
}

// Réservations d'une file, triées dans l'ordre de traitement. Une file de plusieurs statuts réunit les pages
// de chaque statut (au plus 10 pages, soit 150 réservations par statut) : `capped` signale qu'on a atteint
// cette limite. `filters` : { period, organizationId }.
export async function fetchQueue(queue, { period, organizationId }, { signal } = {}) {
  const base = { ...periodParams(period), ...(organizationId ? { organization_id: organizationId } : {}) }
  let capped = false
  const lists = await Promise.all(
    queue.statuses.map((status) =>
      fetchAllPages(
        async (page, options) => {
          const result = await getReservations({ ...base, status, page }, options)
          if (page === 10 && result.meta.last_page > 10) capped = true
          return result
        },
        { signal },
      ),
    ),
  )
  return { items: sortQueue(lists.flat(), base.sort), capped }
}

// Nombre de réservations de chaque file pour les filtres courants (une requête par statut, lue dans meta.total)
export async function fetchQueueCounts({ period, organizationId }, { signal } = {}) {
  const base = { ...periodParams(period), ...(organizationId ? { organization_id: organizationId } : {}), page: 1 }
  const statuses = [...new Set(QUEUES.flatMap((queue) => queue.statuses))]
  const totals = await Promise.all(statuses.map((status) => getReservations({ ...base, status }, { signal })))
  const byStatus = Object.fromEntries(statuses.map((status, index) => [status, totals[index].meta.total]))
  return Object.fromEntries(
    QUEUES.map((queue) => [queue.value, queue.statuses.reduce((sum, status) => sum + byStatus[status], 0)]),
  )
}
