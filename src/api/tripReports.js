import { api } from './client'

// Comptes rendus de trajet (PR backend « trip reports ») : le chauffeur affecté déclare si le trajet a été réalisé,
// de l'heure de départ jusqu'au lendemain 12:00 ; un agent ou un admin, dès l'heure de départ et sans délai.

// { data: compte rendu ou null, meta: { driver_window_opens_at, driver_window_closes_at, can_submit } }
export async function getTripReport(reservationId, { signal } = {}) {
  const { data } = await api.get(`/reservations/${reservationId}/trip-report`, { signal })
  return data
}

// Crée (201) ou met à jour (200) le compte rendu ; renvoie le compte rendu enregistré
export async function saveTripReport(reservationId, values) {
  const realised = values.outcome === 'realise'
  const { data } = await api.put(`/reservations/${reservationId}/trip-report`, {
    outcome: values.outcome || null,
    actual_departure_time: realised ? values.actual_departure_time || null : null,
    actual_return_time: realised ? values.actual_return_time || null : null,
    actual_nb_children: realised ? Number(values.actual_nb_children) : null,
    actual_nb_adults: realised ? Number(values.actual_nb_adults) : null,
    remarks: values.remarks.trim() || null,
  })
  return data.data
}

// Comptes rendus de plusieurs réservations (badges de listes), 100 au plus par appel : on découpe en lots
export async function getTripReports(reservationIds, { signal } = {}) {
  const batches = []
  for (let index = 0; index < reservationIds.length; index += 100) batches.push(reservationIds.slice(index, index + 100))
  const results = await Promise.all(
    batches.map((ids) => api.get('/trip-reports', { params: { reservation_ids: ids }, signal })),
  )
  return results.flatMap((response) => response.data.data)
}
