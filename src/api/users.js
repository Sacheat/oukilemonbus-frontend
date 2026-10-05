import { api } from './client'

// Liste des comptes (rôles internes uniquement), avec leurs `roles`, paginée par 15, les plus récents d'abord.
// `search` : chaque mot doit apparaître dans le prénom, le nom ou l'email (sans tenir compte
// des majuscules ni des accents) ; `role` (admin, agent_communal, chauffeur, user) et `active` (1 ou 0) filtrent
// la liste. Les liens de pagination conservent les paramètres.
export async function getUsers(params = {}, { signal } = {}) {
  const { data } = await api.get('/users', { params, signal })
  return data
}

export async function updateProfile(userId, { first_name, last_name, email, phone }) {
  const { data } = await api.patch(`/users/${userId}`, { first_name, last_name, email, phone: phone || null })
  return data.data
}

export async function updatePassword(userId, { current_password, password, password_confirmation }) {
  await api.patch(`/users/${userId}/password`, { current_password, password, password_confirmation })
}

// Un compte (rôles internes ; chacun peut voir le sien)
export async function getUser(userId, { signal } = {}) {
  const { data } = await api.get(`/users/${userId}`, { signal })
  return data.data
}

// Création d'un compte par un admin (rôle « user » de départ, comme l'inscription) : 201 avec le compte
export async function createUser({ first_name, last_name, email, phone, password, password_confirmation }) {
  const { data } = await api.post('/users', {
    first_name,
    last_name,
    email,
    phone: phone || null,
    password,
    password_confirmation,
  })
  return data.data
}

// Remplace les rôles globaux (admin seulement) : au moins un parmi admin, agent_communal, chauffeur, user
export async function updateUserRoles(userId, roles) {
  const { data } = await api.patch(`/users/${userId}/roles`, { roles })
  return data.data
}

// Active ou désactive un compte ; un compte désactivé ne peut plus se connecter (sert à la réactivation)
export async function updateUserStatus(userId, active) {
  const { data } = await api.patch(`/users/${userId}/status`, { active })
  return data.data
}

// Un compte avec ses rôles pour le panneau d'administration. GET /users/{id} peut renvoyer le compte sans `roles` :
// on les reprend alors de la liste, filtrée sur son email (une requête, le compte en tête des résultats).
export async function getUserWithRoles(userId, { signal } = {}) {
  const user = await getUser(userId, { signal })
  if (user.roles) return user
  const { data } = await getUsers({ search: user.email }, { signal })
  return { ...user, roles: data.find((item) => item.id === user.id)?.roles ?? [] }
}

// Désactivation par l'admin : active = false et tokens API révoqués (204, sans corps : on relit le compte).
// Réversible par updateUserStatus(id, true). Dernier admin actif : 422 avec le motif dans `message`.
export async function deactivateUser(userId) {
  await api.patch(`/users/${userId}/deactivate`)
  return getUserWithRoles(userId)
}

// Envoie au compte le lien « réinitialiser le mot de passe » (le même que « Mot de passe oublié », valable 60 min) :
// 202 avec `message`. Compte désactivé ou lien envoyé il y a moins d'une minute : 422 (motif dans `message`).
export async function sendPasswordResetLink(userId) {
  const { data } = await api.post(`/users/${userId}/password-reset-link`)
  return data.message
}
