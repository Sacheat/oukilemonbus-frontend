import { RELATIONSHIP_TYPE_LABELS } from './labels'
import { RECURRENCE_ORGANIZATION_TYPES } from './recurrences'

// Réservation ou série encodée par un agent ou un admin (demande téléphonée) : choix de l'organisation, puis du
// demandeur parmi ses membres (il est prévenu et suit la demande dans son espace). Valeur vide : l'agent lui-même.

// Demandeurs proposés : l'agent, puis les membres, responsables d'abord, par nom
export function requesterOptions(members, agent) {
  const sorted = members
    .filter((member) => member.user_id !== agent.id)
    .sort((a, b) => Number(b.is_manager) - Number(a.is_manager) || a.full_name.localeCompare(b.full_name, 'fr'))
  return [
    { value: '', label: `Moi-même (${[agent.first_name, agent.last_name].filter(Boolean).join(' ')})` },
    ...sorted.map((member) => ({
      value: String(member.user_id),
      label: `${member.full_name} · ${RELATIONSHIP_TYPE_LABELS[member.relationship_type] ?? member.relationship_type}`,
    })),
  ]
}

// Pourquoi cette organisation ne peut pas être choisie, ou null : bannie, ou série pour un type sans récurrences
export function organizationBlocker(organization, { series = false } = {}) {
  if (!organization) return null
  if (organization.is_banned) return 'Cette organisation est bannie : aucune réservation n’est possible.'
  if (series && !RECURRENCE_ORGANIZATION_TYPES.includes(organization.type)) {
    return 'Les séries sont réservées aux écoles communales et au personnel communal.'
  }
  return null
}

// Nom du demandeur pour le message de fin (l'agent si aucun membre n'est choisi)
export function requesterName(members, requesterId, agent) {
  const member = members.find((item) => String(item.user_id) === String(requesterId))
  return member?.full_name ?? [agent.first_name, agent.last_name].filter(Boolean).join(' ')
}
