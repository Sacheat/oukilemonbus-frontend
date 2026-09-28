// Les droits viennent de /auth/me. Le backend reste l'autorité : une Policy peut
// encore refuser une action selon le statut ou l'appartenance (403).

export const INTERNAL_ROLES = ['admin', 'agent_communal']

export function hasRole(user, ...roles) {
  return Boolean(user?.roles?.some((role) => roles.includes(role)))
}

export function can(user, permission) {
  return Boolean(user?.permissions?.includes(permission))
}

export function isInternal(user) {
  return hasRole(user, ...INTERNAL_ROLES)
}

// « Responsable » n'est pas un rôle : c'est la relation avec une organisation donnée
export function isManagerOf(user, organizationId) {
  return Boolean(
    user?.organizations?.some(
      (organization) => organization.id === organizationId && organization.membership?.is_manager,
    ),
  )
}

export function isEmailVerified(user) {
  return Boolean(user?.email_verified_at)
}

// Espace d'arrivée selon le rôle principal
export function getHomePath(user) {
  if (isInternal(user)) return '/gestion'
  if (hasRole(user, 'chauffeur')) return '/chauffeur'
  return '/espace'
}
