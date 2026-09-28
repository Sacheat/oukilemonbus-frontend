import { api } from './client'

export async function updateProfile(userId, { first_name, last_name, email, phone }) {
  const { data } = await api.patch(`/users/${userId}`, { first_name, last_name, email, phone: phone || null })
  return data.data
}

export async function updatePassword(userId, { current_password, password, password_confirmation }) {
  await api.patch(`/users/${userId}/password`, { current_password, password, password_confirmation })
}
