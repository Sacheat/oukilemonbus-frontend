// Conflits d'une réservation dans l'espace gestion : ce que chaque type veut dire pour l'agent et ce qui le règle,
// d'après le backend :
//   - affecter un chauffeur / un véhicule résout automatiquement « aucun chauffeur / véhicule disponible » ;
//   - une décision favorable du Collège résout automatiquement les dérogations horaires ;
//   - refuser ou annuler l'autre réservation résout automatiquement un chevauchement, et le marquer « résolu »
//     à la main est refusé tant que les créneaux se chevauchent encore ;
//   - quand plus aucun conflit n'est ouvert, la réservation repasse en attente (approuvée et affectée pour une école).

// Actions possibles sur un conflit, dans l'ordre d'affichage :
//   assign, retryAssign, council (ouvrent l'action de l'agent), edit (page de modification),
//   reject (refuser la réservation), resolve (marquer le conflit comme résolu, avec `resolveLabel`)
const DEROGATION = {
  tone: 'info',
  explanation: 'Horaire hors des règles habituelles. Une décision favorable du Collège lève la dérogation automatiquement.',
  actions: ['council', 'resolve'],
  resolveLabel: 'Accepter la dérogation',
}

export const CONFLICT_GUIDES = {
  no_driver_available: {
    tone: 'warning',
    explanation: 'Aucun chauffeur n’est libre sur ce créneau. Affectez-en un : le conflit sera résolu automatiquement.',
    actions: ['assign', 'retryAssign'],
  },
  no_vehicle_available: {
    tone: 'warning',
    explanation: 'Aucun véhicule n’est libre sur ce créneau. Affectez-en un : le conflit sera résolu automatiquement.',
    actions: ['assign', 'retryAssign'],
  },
  vehicle_capacity_unavailable: {
    tone: 'warning',
    explanation: 'Aucun véhicule libre n’a assez de places pour ce groupe. Affectez un véhicule plus grand ou réduisez le nombre de passagers.',
    actions: ['assign', 'edit', 'resolve'],
    resolveLabel: 'Marquer comme résolu',
  },
  schedule_overlap: {
    tone: 'conflict',
    explanation:
      'Le bus est déjà occupé par une autre réservation sur ce créneau. Refusez ou annulez l’une des deux (l’autre est débloquée automatiquement), ou décalez les horaires.',
    actions: ['edit', 'reject'],
  },
  impossible_time_window: {
    tone: 'conflict',
    explanation: 'Le créneau ne laisse pas assez de temps pour l’aller et le retour. Modifiez les horaires.',
    actions: ['edit', 'resolve'],
    resolveLabel: 'Marquer comme résolu',
  },
  distance_not_calculated: {
    tone: 'warning',
    explanation: 'La distance n’a pas pu être calculée (adresse incomplète ou introuvable). Corrigez les lieux, ou acceptez sans distance.',
    actions: ['edit', 'resolve'],
    resolveLabel: 'Accepter sans distance',
  },
  quota_exceeded: {
    tone: 'warning',
    explanation: 'L’organisation a dépassé son quota annuel de réservations. Acceptez malgré le quota, ou refusez.',
    actions: ['resolve', 'reject'],
    resolveLabel: 'Accepter malgré le quota',
  },
  departure_before_allowed_time: DEROGATION,
  return_after_allowed_time: DEROGATION,
  duration_over_allowed_limit: DEROGATION,
  // Anciens types, encore possibles sur des données existantes
  departure_before_08h: DEROGATION,
  return_after_17h: DEROGATION,
}

const DEFAULT_GUIDE = { tone: 'warning', explanation: null, actions: ['resolve'], resolveLabel: 'Marquer comme résolu' }

export function conflictGuide(conflict) {
  return CONFLICT_GUIDES[conflict.type] ?? DEFAULT_GUIDE
}

// Actions à proposer pour un conflit : celles du guide que l'agent peut faire maintenant (`actions` : agentActions)
export function conflictActions(conflict, actions) {
  const allowed = {
    assign: actions.assign,
    retryAssign: actions.retryAssign,
    council: actions.council,
    edit: actions.edit,
    reject: actions.reject,
    resolve: actions.resolveConflicts,
  }
  return conflictGuide(conflict).actions.filter((name) => allowed[name])
}

// Dérogations qu'une décision favorable du Collège lève automatiquement (CouncilDecisionService du backend)
export const COUNCIL_DEROGATION_TYPES = ['departure_before_allowed_time', 'return_after_allowed_time', 'duration_over_allowed_limit']

// La réservation a une dérogation horaire ouverte : seul cas où une décision du Collège facultative a un effet
export function hasOpenCouncilDerogation(reservation) {
  return openConflictsOf(reservation).some((conflict) => COUNCIL_DEROGATION_TYPES.includes(conflict.type))
}

export function openConflictsOf(reservation) {
  return (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved)
}

export function resolvedConflictsOf(reservation) {
  return (reservation.conflicts ?? [])
    .filter((conflict) => conflict.is_resolved)
    .sort((first, second) => (second.resolved_at ?? '').localeCompare(first.resolved_at ?? ''))
}

// ----- Frise des créneaux d'un chevauchement -----

// "2026-10-20T09:30:00" (heure locale, sans fuseau) → minutes depuis minuit
function minutesOf(localDateTime) {
  const [hours, minutes] = localDateTime.slice(11, 16).split(':').map(Number)
  return hours * 60 + minutes
}

// Occupation du bus d'une réservation (début et fin en minutes), ou null si le backend ne l'a pas calculée
export function occupationOf(reservation) {
  const occupation = reservation?.estimated_occupation
  if (!occupation?.start_at || !occupation?.end_at) return null
  return { start: minutesOf(occupation.start_at), end: minutesOf(occupation.end_at) }
}

// Frise de deux occupations le même jour : bornes arrondies à l'heure (une heure de marge de chaque côté),
// position de chaque barre et de la zone commune en pourcentage de la largeur. null si une occupation manque.
export function overlapTimeline(current, other) {
  const a = occupationOf(current)
  const b = occupationOf(other)
  if (!a || !b) return null
  const from = Math.max(0, Math.floor(Math.min(a.start, b.start) / 60) * 60 - 60)
  const to = Math.min(24 * 60, Math.ceil(Math.max(a.end, b.end) / 60) * 60 + 60)
  const span = to - from
  const place = ({ start, end }) => ({ left: ((start - from) / span) * 100, width: ((end - start) / span) * 100 })
  const shared = { start: Math.max(a.start, b.start), end: Math.min(a.end, b.end) }
  const hours = []
  for (let minute = from; minute <= to; minute += 60) hours.push({ label: `${String(minute / 60).padStart(2, '0')}h`, left: ((minute - from) / span) * 100 })
  return {
    current: place(a),
    other: place(b),
    shared: shared.end > shared.start ? place(shared) : null,
    sharedMinutes: Math.max(0, shared.end - shared.start),
    hours,
  }
}
