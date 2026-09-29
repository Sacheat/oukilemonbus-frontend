import { api } from './client'

// Mes notifications in-app, plus récentes d'abord. Liste paginée : { data, meta, links }.
// Filtres : unread (bool), category, priority, search, per_page (1–100)
export async function getNotifications(params = {}, { signal } = {}) {
  const { data } = await api.get('/notifications', { params, signal })
  return data
}

// Route légère, prévue pour être interrogée régulièrement (badge de la cloche)
export async function getUnreadCount({ signal } = {}) {
  const { data } = await api.get('/notifications/unread-count', { signal })
  return data.data.unread_count
}

// `id` : UUID (chaîne)
export async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all')
}

export async function getNotificationPreferences({ signal } = {}) {
  const { data } = await api.get('/notifications/preferences', { signal })
  return data.data
}

// Champs partiels ; renvoie les préférences à jour
export async function updateNotificationPreferences(values) {
  const { data } = await api.patch('/notifications/preferences', values)
  return data.data
}
