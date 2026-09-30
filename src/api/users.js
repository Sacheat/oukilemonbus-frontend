import { api } from './client'
import { fetchAllPages } from './pagination'

// Liste des comptes (rôles internes uniquement), avec leurs `roles`
export async function getUsers(params = {}, { signal } = {}) {
  const { data } = await api.get('/users', { params, signal })
  return data
}

// Tous les comptes, toutes pages confondues (le backend ne propose pas de recherche)
export function getAllUsers({ signal } = {}) {
  return fetchAllPages((page, options) => getUsers({ page }, options), { signal })
}

export async function updateProfile(userId, { first_name, last_name, email, phone }) {
  const { data } = await api.patch(`/users/${userId}`, { first_name, last_name, email, phone: phone || null })
  return data.data
}

export async function updatePassword(userId, { current_password, password, password_confirmation }) {
  await api.patch(`/users/${userId}/password`, { current_password, password, password_confirmation })
}
