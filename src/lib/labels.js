// Libellés des valeurs d'enum du backend (français sans accents côté API).
// Quand une Resource renvoie déjà un *_label (status_label, type_label…), préférer celui-ci.

export const ROLE_LABELS = {
  admin: 'Administrateur',
  agent_communal: 'Agent communal',
  user: 'Utilisateur',
  chauffeur: 'Chauffeur',
}

export const RESERVATION_STATUS_LABELS = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  confirme: 'Confirmé',
  en_conflit: 'En conflit',
  refuse: 'Refusé',
  annule: 'Annulé',
}

// Demandes d'organisation / d'adhésion et décisions du Collège
export const REQUEST_STATUS_LABELS = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  refuse: 'Refusé',
}

export const ORGANIZATION_TYPE_LABELS = {
  ecole_communale: 'École communale',
  personnel_communal: 'Personnel communal',
  cpas: 'CPAS',
  asbl: 'ASBL',
  externe: 'Externe',
}

export const ACTIVITY_TYPE_LABELS = {
  standard: 'Standard',
  gymnastique: 'Gymnastique',
  psychomotricite: 'Psychomotricité',
}

export const APPROVAL_TYPE_LABELS = {
  auto: 'Automatique',
  manuel: 'Manuelle',
}

export const RELATIONSHIP_TYPE_LABELS = {
  responsable: 'Responsable',
  directeur: 'Directeur',
  prof: 'Professeur',
  animateur: 'Animateur',
  referent: 'Référent',
  membre: 'Membre',
}

export const CONFLICT_TYPE_LABELS = {
  schedule_overlap: 'Chevauchement de planning',
  no_driver_available: 'Aucun chauffeur disponible',
  no_vehicle_available: 'Aucun véhicule disponible',
  vehicle_capacity_unavailable: 'Aucun véhicule de capacité suffisante',
  distance_not_calculated: 'Distance non calculée',
  quota_exceeded: 'Quota dépassé',
  impossible_time_window: 'Créneau impossible',
  departure_before_allowed_time: "Départ avant l'heure autorisée",
  return_after_allowed_time: "Retour après l'heure autorisée",
  duration_over_allowed_limit: 'Durée maximale dépassée',
  // anciens types, encore possibles sur des données existantes
  departure_before_08h: 'Départ avant 8 h',
  return_after_17h: 'Retour après 17 h',
}

export const DOCUMENT_TYPE_LABELS = {
  deliberation: 'Délibération',
  feuille_route: 'Feuille de route',
  justificatif: 'Justificatif',
  planning: 'Planning',
  attestation: 'Attestation',
}

export const RECURRENCE_FREQUENCY_LABELS = {
  hebdomadaire: 'Hebdomadaire',
  bihebdomadaire: 'Toutes les deux semaines',
  mensuel: 'Mensuel',
}

export const NOTIFICATION_CATEGORY_LABELS = {
  reservation_updates: 'Suivi de mes réservations',
  admin_workflow: 'Travail à traiter',
  driver_planning: 'Planning chauffeur',
  last_minute_cancellation: 'Annulation de dernière minute',
  driver_alert: 'Demandes d’aide des chauffeurs',
  weekly_planning: 'Planning hebdomadaire',
}

// Statut accordé au nombre, pour les décomptes (« 28 confirmés », « 1 annulé », « 2 en conflit »)
const STATUS_COUNT_LABELS = {
  en_attente: ['en attente', 'en attente'],
  approuve: ['approuvé', 'approuvés'],
  confirme: ['confirmé', 'confirmés'],
  en_conflit: ['en conflit', 'en conflit'],
  refuse: ['refusé', 'refusés'],
  annule: ['annulé', 'annulés'],
}

export function statusCountLabel(status, count) {
  const [one, many] = STATUS_COUNT_LABELS[status] ?? [status, status]
  return `${count} ${count > 1 ? many : one}`
}
