import { getReservations } from '../api/reservations'
import { formatDate } from './dates'
import { mondayOf, periodLength } from './planning'
import { keyLabel } from './shortcuts'
import { todayApiDate, yesterdayApiDate } from './reservations'

// Files de la page « Réservations » de l'espace gestion, dans l'ordre des pastilles.
// `statuses` : statuts affichés ; `council` : seulement celles qui attendent le Collège (council=a_decider : type
// soumis au Collège, sans décision ou décision en attente, trajet pas encore passé) ; `unassigned` : seulement celles
// auxquelles il manque le chauffeur ou le véhicule (unassigned=1, filtré par le backend : une réservation approuvée et
// complète est confirmée automatiquement, elle n'a rien à faire dans « À affecter ») ; `passengersToConfirm` : trajets
// actifs des 14 prochains jours dont le demandeur n'a pas confirmé les passagers (passengers_to_confirm=1, même règle
// que le compteur du tableau de bord ; l'agent peut relancer le demandeur). La valeur est gardée dans l'URL.
export const QUEUES = [
  { value: 'a-traiter', label: 'À traiter', statuses: ['en_attente', 'en_conflit'] },
  { value: 'en-attente', label: 'En attente', statuses: ['en_attente'], dot: 'bg-warning' },
  { value: 'en-conflit', label: 'En conflit', statuses: ['en_conflit'], dot: 'bg-conflict' },
  { value: 'college', label: 'Collège à décider', statuses: ['en_attente', 'en_conflit'], council: true, dot: 'bg-accent' },
  { value: 'a-affecter', label: 'À affecter', statuses: ['approuve'], unassigned: true, dot: 'bg-info' },
  { value: 'confirmees', label: 'Confirmées', statuses: ['confirme'], dot: 'bg-success' },
  {
    value: 'passagers',
    label: 'Passagers à confirmer',
    statuses: ['en_attente', 'en_conflit', 'approuve', 'confirme'],
    passengersToConfirm: true,
    dot: 'bg-neutral',
  },
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
// Trajet passé (`today` : aujourd'hui à Bruxelles, le jour même n'est pas passé) : consultation seulement. Le backend
// ne bloque que l'approbation, mais un trajet passé n'a plus à être affecté, confirmé, refusé ni annulé (la clôture de
// nuit s'occupe des non confirmés). Restent les notes d'une décision du Collège existante et « Résolu » sur un conflit.
export function agentActions(reservation, can, decision = null, today) {
  const { status } = reservation
  const tripPassed = reservation.trip_date.slice(0, 10) < today
  const terminal = status === 'refuse' || status === 'annule'
  const open = !terminal && !tripPassed
  const assigned = Boolean(reservation.driver_id && reservation.vehicle_id)
  const openConflicts = (reservation.conflicts ?? []).some((conflict) => !conflict.is_resolved)
  const needsCouncil = reservation.approval_type === 'manuel'
  const councilOk = decision?.decision_status === 'approuve'
  const approvable = can('reservations.approve') && ['en_attente', 'en_conflit'].includes(status) && !tripPassed
  return {
    tripPassed,
    approve: approvable && (!needsCouncil || councilOk),
    approveBlocked: approvable && needsCouncil && !councilOk,
    // Trajet passé encore à traiter : plus d'approbation possible, la clôture automatique l'annulera cette nuit
    approveExpired: can('reservations.approve') && ['en_attente', 'en_conflit'].includes(status) && tripPassed,
    council: can('council-decisions.create') && needsCouncil && !terminal && (!tripPassed || Boolean(decision)),
    reject: can('reservations.reject') && ['en_attente', 'en_conflit', 'approuve'].includes(status) && !tripPassed,
    assign: can('reservations.assign') && open,
    retryAssign: can('reservations.assign') && open && !assigned,
    confirm: can('reservations.confirm') && status === 'approuve' && assigned && !openConflicts && !tripPassed,
    cancel: can('reservations.cancel') && ['en_attente', 'en_conflit', 'approuve', 'confirme'].includes(status) && !tripPassed,
    resolveConflicts: can('reservations.manage-conflicts') && !terminal,
    // Modifier (horaires, lieux, passagers) pour régler un conflit : statut non terminal, trajet pas encore passé
    edit: can('reservations.update') && open,
  }
}

// Paramètres de GET /reservations pour une file et des filtres (sans la page) : un seul appel avec statuses[],
// trié par le backend (date puis heure de départ). `filters` : { period, organizationId, search }.
function queueParams(queue, { period, organizationId, search }) {
  return {
    ...periodParams(period),
    statuses: queue.statuses,
    ...(queue.council && { council: 'a_decider' }),
    ...(queue.unassigned && { unassigned: 1 }),
    ...(queue.passengersToConfirm && { passengers_to_confirm: 1 }),
    ...(organizationId && { organization_id: organizationId }),
    ...(search && { q: search }),
  }
}

// Ce qui détermine la file chargée (file, période, organisation, recherche), sous forme de texte :
// le hook useQueue ne recharge que si l'une de ces valeurs change.
export function queueRequestKey(queue, filters) {
  return JSON.stringify({ queue: queue.value, ...filters })
}

// Les `pageCount` premières pages d'une file (15 réservations par page), mises bout à bout :
// { items, total, lastPage }. « Charger plus » relit toutes les pages pour rester juste après une action
// (une réservation traitée quitte la file et décale les suivantes).
export async function fetchQueuePages(requestKey, pageCount, { signal } = {}) {
  const { queue, ...filters } = JSON.parse(requestKey)
  const params = queueParams(queueOf(queue), filters)
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, index) => getReservations({ ...params, page: index + 1 }, { signal })),
  )
  const { meta } = pages[0]
  return { items: pages.flatMap((page) => page.data), total: meta.total, lastPage: meta.last_page }
}

// Nombre de réservations de chaque file pour les filtres courants (une requête par file, lue dans meta.total)
export async function fetchQueueCounts(filters, { signal } = {}) {
  const totals = await Promise.all(
    QUEUES.map((queue) => getReservations({ ...queueParams(queue, filters), page: 1 }, { signal })),
  )
  return Object.fromEntries(QUEUES.map((queue, index) => [queue.value, totals[index].meta.total]))
}

// Nombre de demandes « à traiter » (en attente ou en conflit, trajet à venir) : même chiffre que la pastille
// « À traiter » de la page, pour le badge du menu. Une seule réservation demandée suffit, on lit meta.total.
export async function fetchPendingCount({ signal } = {}) {
  const page = await getReservations({ ...queueParams(queueOf(DEFAULT_QUEUE), { period: 'a-venir' }), page: 1 }, { signal })
  return page.meta.total
}

// ----- Affichage de la file -----

// Écart en jours entre aujourd'hui et le jour du trajet (0 : aujourd'hui, 1 : demain, négatif : passé)
function daysUntil(day, today) {
  return periodLength(today, day.slice(0, 10)) - 1
}

// Libellé d'un jour de la file : « Aujourd'hui », « Demain », « Hier », sinon « jeudi 8 octobre »
// (avec l'année si ce n'est pas l'année en cours)
export function dayLabel(day, today) {
  const days = daysUntil(day, today)
  if (days === 0) return 'Aujourd’hui'
  if (days === 1) return 'Demain'
  if (days === -1) return 'Hier'
  const sameYear = day.slice(0, 4) === today.slice(0, 4)
  return formatDate(day, { weekday: 'long', day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) })
}

// Réservations rangées par jour de trajet, dans l'ordre de la file : [{ day, label, items }]
export function groupByDay(reservations, today) {
  const groups = []
  for (const reservation of reservations) {
    const day = reservation.trip_date.slice(0, 10)
    if (groups.at(-1)?.day !== day) groups.push({ day, label: dayLabel(day, today), items: [] })
    groups.at(-1).items.push(reservation)
  }
  return groups
}

// Il reste quelque chose à faire avant le trajet : décider (en attente, en conflit) ou affecter (approuvée)
function needsWork(reservation) {
  if (['en_attente', 'en_conflit'].includes(reservation.status)) return true
  return reservation.status === 'approuve' && !(reservation.driver_id && reservation.vehicle_id)
}

// Urgence d'une demande encore à traiter dont le trajet approche :
//   aujourd'hui ou demain → 'danger' ; dans 2 ou 3 jours → 'warning' ; sinon (ou rien à faire, ou passé) → null
export function urgencyOf(reservation, today) {
  if (!needsWork(reservation)) return null
  const days = daysUntil(reservation.trip_date, today)
  if (days < 0 || days > 3) return null
  return days <= 1 ? 'danger' : 'warning'
}

// Repères d'une ligne : ce qui attend avant de pouvoir avancer. [{ label, tone }]
//   validation manuelle en attente ou en conflit → état du Collège (`council_decision_status` du backend ;
//     absent : repère neutre « Collège »)
//   approuvée sans chauffeur et / ou sans véhicule → ce qui manque
export function rowHints(reservation) {
  const hints = []
  const undecided = ['en_attente', 'en_conflit'].includes(reservation.status)
  if (undecided && reservation.approval_type === 'manuel') {
    const council = reservation.council_decision_status
    if (council === undefined) hints.push({ label: 'Collège', tone: 'neutral' })
    else if (council === 'approuve') hints.push({ label: 'Collège favorable', tone: 'success' })
    else hints.push({ label: 'Collège à décider', tone: 'info' })
  }
  if (reservation.status === 'approuve') {
    const missing = [!reservation.driver_id && 'chauffeur', !reservation.vehicle_id && 'véhicule'].filter(Boolean)
    if (missing.length > 0) hints.push({ label: `Sans ${missing.join(' ni ')}`, tone: 'warning' })
  }
  return hints
}

// Prochaine étape d'une réservation, en une phrase pour le haut du panneau : { tone, text } ou null.
// `actions` : agentActions ; `decision` : décision du Collège (undefined pendant le chargement) ;
// `keys` : touches des raccourcis, rappelées entre parenthèses.
export function nextStep(reservation, actions, decision, keys) {
  const { status } = reservation
  const key = (id) => (keys[id] ? ` (${keyLabel(keys[id])})` : '')
  const openConflicts = (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved).length
  if (actions.tripPassed || ['refuse', 'annule'].includes(status)) return null

  if (['en_attente', 'en_conflit'].includes(status)) {
    if (reservation.approval_type === 'manuel' && decision === undefined) return null
    if (actions.approveBlocked && openConflicts > 0) {
      return {
        tone: 'conflict',
        text: `${openConflicts > 1 ? `${openConflicts} conflits à régler` : 'Un conflit à régler'} (voir ci-dessous), et la décision du Collège à encoder${key('council')} dès qu’elle est connue.`,
      }
    }
    if (actions.approveBlocked) {
      return { tone: 'info', text: `En attente de la décision du Collège : encodez-la${key('council')} dès qu’elle est connue.` }
    }
    if (openConflicts > 0) {
      return {
        tone: 'conflict',
        text: `${openConflicts > 1 ? `${openConflicts} conflits à régler` : 'Un conflit à régler'} : voyez ci-dessous ce qui le règle. Vous pouvez aussi approuver${key('approve')} malgré le conflit.`,
      }
    }
    return { tone: 'success', text: `Prête à être approuvée${key('approve')}.` }
  }
  if (status === 'approuve') {
    const missing = [!reservation.driver_id && 'un chauffeur', !reservation.vehicle_id && 'un véhicule'].filter(Boolean)
    if (missing.length > 0) {
      return { tone: 'warning', text: `Il manque ${missing.join(' et ')} : affectez${key('assign')} ou relancez l’affectation automatique.` }
    }
    if (openConflicts > 0) return { tone: 'conflict', text: 'Réglez le conflit ci-dessous avant de confirmer.' }
    return { tone: 'success', text: `Chauffeur et véhicule affectés : prête à être confirmée${key('confirm')}.` }
  }
  if (status === 'confirme') return { tone: 'neutral', text: 'Confirmée : rien à faire, le trajet est prêt.' }
  return null
}

// Lien vers ce trajet dans le Planning : semaine du trajet (du lundi au vendredi), ou vue liste sur ce seul jour
// pour un trajet le week-end ; tous les statuts pour qu'un trajet refusé ou annulé y apparaisse aussi.
export function planningHref(reservation) {
  const day = reservation.trip_date.slice(0, 10)
  const params = new URLSearchParams()
  const monday = mondayOf(day)
  if (periodLength(monday, day) > 5) {
    params.set('vue', 'liste')
    params.set('du', day)
    params.set('au', day)
  } else {
    params.set('semaine', monday)
  }
  if (['refuse', 'annule'].includes(reservation.status)) params.set('statuts', 'tous')
  params.set('trajet', String(reservation.id))
  return `/gestion/planning?${params}`
}
