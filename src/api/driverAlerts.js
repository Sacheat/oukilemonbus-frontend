import { api } from './client'

// Demandes d'aide des chauffeurs (bouton « Aide ») et leur suivi par les agents. Backend : DriverAlertService.

// Liste paginée : statuses[], date_from, date_to, page, per_page (chauffeur : les siennes)
export async function getDriverAlerts(params = {}, { signal } = {}) {
  const { data } = await api.get('/driver-alerts', { params, signal })
  return data
}

export async function getDriverAlert(alertId, { signal } = {}) {
  const { data } = await api.get(`/driver-alerts/${alertId}`, { signal })
  return data.data
}

// `idempotencyKey` : un UUID par appui sur « Envoyer », réutilisé si la requête est relancée (pas de double alerte)
export async function createDriverAlert({ reservationId, message, position }, idempotencyKey) {
  const { data } = await api.post(
    '/driver-alerts',
    { reservation_id: reservationId ?? null, message: message?.trim() || null, position },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return data.data
}

export async function updateDriverAlertPosition(alertId, position) {
  const { data } = await api.patch(`/driver-alerts/${alertId}/position`, { position })
  return data.data
}

export async function takeDriverAlert(alertId) {
  const { data } = await api.post(`/driver-alerts/${alertId}/take`)
  return data.data
}

export async function closeDriverAlert(alertId, closingNote) {
  const { data } = await api.post(`/driver-alerts/${alertId}/close`, { closing_note: closingNote })
  return data.data
}
