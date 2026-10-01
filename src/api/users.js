import { api } from './client'

// Liste des comptes (rôles internes uniquement), avec leurs `roles`, paginée par 15.
// `search` : chaque mot doit apparaître dans le prénom, le nom ou l'email (sans tenir compte
// des majuscules ni des accents) ; les liens de pagination conservent le paramètre.
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
