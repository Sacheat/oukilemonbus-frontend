import { ROLE_LABELS } from './labels'

// Valeur de ?utilisateur= pour ouvrir le formulaire de création
export const NEW_USER = 'nouveau'

// Rôles globaux dans l'ordre d'affichage (cases à cocher, badges, filtre)
export const GLOBAL_ROLES = ['admin', 'agent_communal', 'chauffeur', 'user']

// Filtre par rôle (?role=) : valeur de l'URL = valeur de l'API
export const ROLE_FILTERS = [
  { value: null, label: 'Tous' },
  { value: 'admin', label: 'Administrateurs' },
  { value: 'agent_communal', label: 'Agents' },
  { value: 'chauffeur', label: 'Chauffeurs' },
  { value: 'user', label: 'Utilisateurs' },
]

// Filtre par statut (?statut=) → paramètre `active` de l'API
export const STATUS_FILTERS = [
  { value: null, label: 'Tous les comptes' },
  { value: 'actifs', label: 'Actifs', active: 1 },
  { value: 'desactives', label: 'Désactivés', active: 0 },
]

// Ton du badge de chaque rôle
export const ROLE_TONES = { admin: 'danger', agent_communal: 'info', chauffeur: 'success', user: 'neutral' }

// Lit l'URL de la page : recherche, filtres, page et compte ouvert (valeurs inconnues ignorées)
export function readUsersSearch(searchParams) {
  const role = searchParams.get('role')
  const status = searchParams.get('statut')
  return {
    search: searchParams.get('q') ?? '',
    role: GLOBAL_ROLES.includes(role) ? role : null,
    status: STATUS_FILTERS.some((filter) => filter.value && filter.value === status) ? status : null,
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    openedParam: searchParams.get('utilisateur'), // null, 'nouveau' ou l'id d'un compte
  }
}

// Paramètres de GET /users pour une recherche, des filtres et une page
export function usersApiParams({ search, role, status, page }) {
  const active = STATUS_FILTERS.find((filter) => filter.value === status)?.active
  return {
    page,
    ...(search && { search }),
    ...(role && { role }),
    ...(active !== undefined && { active }),
  }
}

// Rôles d'un compte dans l'ordre d'affichage, avec leur libellé
export function sortedRoles(roles = []) {
  return GLOBAL_ROLES.filter((role) => roles.includes(role)).map((role) => ({ value: role, label: ROLE_LABELS[role] }))
}

// Compte de la liste dont l'id correspond à ?utilisateur= (l'URL donne une chaîne)
export function findUser(userList, userParam) {
  return userList?.find((user) => String(user.id) === userParam)
}

// Valeurs du formulaire d'informations (création ou modification)
export function userFormValues(user) {
  return {
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  }
}

export function newUserFormValues() {
  return { ...userFormValues(null), password: '', password_confirmation: '' }
}

// Champs d'informations modifiés (texte comparé sans espaces autour ; téléphone vide = null)
export function changedUserFields(user, values) {
  const before = userFormValues(user)
  return Object.fromEntries(Object.entries(values).filter(([field, value]) => value.trim() !== (before[field] ?? '').trim()))
}

// Rôles cochés identiques aux rôles actuels ?
export function sameRoles(first = [], second = []) {
  return first.length === second.length && first.every((role) => second.includes(role))
}

// Un admin ne peut ni retirer son propre rôle admin ni désactiver son compte (il perdrait l'accès à cette page).
// Le backend refuse en plus de retirer ou désactiver le dernier admin actif.
export function isSelf(user, currentUser) {
  return user.id === currentUser.id
}

// Mot de passe provisoire : 12 caractères (lettres sans ambiguïté, chiffres, un symbole), tirés par crypto
const PASSWORD_ALPHABETS = ['abcdefghjkmnpqrstuvwxyz', 'ABCDEFGHJKMNPQRSTUVWXYZ', '23456789', '!?@#%+=']

export function generatePassword(length = 12) {
  const random = (max) => crypto.getRandomValues(new Uint32Array(1))[0] % max
  const pick = (alphabet) => alphabet[random(alphabet.length)]
  const all = PASSWORD_ALPHABETS.join('')
  // Au moins un caractère de chaque famille, puis le reste au hasard, mélangé
  const characters = [...PASSWORD_ALPHABETS.map(pick), ...Array.from({ length: length - PASSWORD_ALPHABETS.length }, () => pick(all))]
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const other = random(index + 1)
    ;[characters[index], characters[other]] = [characters[other], characters[index]]
  }
  return characters.join('')
}
