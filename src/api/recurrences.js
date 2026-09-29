import { api } from './client'

// Séries de réservations (écoles et personnel communal). Liste paginée : { data, meta, links }.
export async function getRecurrences(params = {}, { signal } = {}) {
  const { data } = await api.get('/recurrences', { params, signal })
  return data
}

// Série avec ses réservations (occurrences)
export async function getRecurrence(id, { signal } = {}) {
  const { data } = await api.get(`/recurrences/${id}`, { signal })
  return data.data
}

// Simulation : dates valides, dates ignorées (avec motif), conflits par date. Ne crée rien.
export async function previewRecurrence(payload, { signal } = {}) {
  const { data } = await api.post('/recurrences/preview', payload, { signal })
  return data.data
}

// Crée la série et ses occurrences (`idempotencyKey` : anti double création).
// Renvoie { recurrence, report } ; report = { created_count, skipped_dates, failed_dates },
// les dates ignorées et en échec avec leur motif ({ date, reason }).
export async function createRecurrence(payload, idempotencyKey) {
  const { data } = await api.post('/recurrences', payload, { headers: { 'Idempotency-Key': idempotencyKey } })
  return { recurrence: data.data, report: data.meta }
}

// Annule les occurrences encore actives : { cancelled_reservation_ids, cancelled_count }
export async function cancelRecurrence(id, reason) {
  const { data } = await api.patch(`/recurrences/${id}/cancel`, { reason })
  return data.data
}
