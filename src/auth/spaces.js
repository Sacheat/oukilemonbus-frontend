import { BriefcaseBusiness, Bus, House } from 'lucide-react'
import { getHomePath, hasRole, INTERNAL_ROLES } from './permissions'

// Espaces de l'application, dans l'ordre de getHomePath. Un utilisateur à plusieurs rôles
// (ex. agent communal et chauffeur) a accès à plusieurs espaces et passe de l'un à l'autre
// avec le sélecteur d'espace ; le dernier visité devient son espace d'arrivée.
export const SPACES = [
  { path: '/gestion', label: 'Gestion', icon: BriefcaseBusiness, roles: INTERNAL_ROLES },
  { path: '/chauffeur', label: 'Chauffeur', icon: Bus, roles: ['chauffeur'] },
  { path: '/espace', label: 'Usager', icon: House, roles: ['user'] },
]

// Préférence d'affichage propre au navigateur, comme le thème : pas une donnée métier
const STORAGE_KEY = 'oukilemonbus-espace'

export function getSpaces(user) {
  return SPACES.filter((space) => hasRole(user, ...space.roles))
}

// Espace dont relève une URL (null pour les pages communes comme /compte)
export function spaceOfPath(pathname) {
  return SPACES.find((space) => pathname === space.path || pathname.startsWith(`${space.path}/`)) ?? null
}

export function rememberSpace(path) {
  try {
    localStorage.setItem(STORAGE_KEY, path)
  } catch {
    // Stockage indisponible (navigation privée…) : on retombera sur l'espace principal
  }
}

// Espace d'arrivée : le dernier visité s'il est toujours accessible, sinon l'espace du rôle principal
export function getLandingPath(user) {
  let saved = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Stockage indisponible : espace principal
  }
  return getSpaces(user).some((space) => space.path === saved) ? saved : getHomePath(user)
}
