import { api } from './client'

// Avancement des trajets (« Ma journée ») : étapes enregistrées par le chauffeur (Départ, Arrivée, retour), avec la
// position du téléphone. Backend : TripProgressService (feature/journee-chauffeur).

// { data: { state, next_step, events }, meta: { first_departure_opens_at, first_departure_closes_at, steps_close_at, can_record } }
export async function getTripProgress(reservationId, { signal } = {}) {
  const { data } = await api.get(`/reservations/${reservationId}/trip-progress`, { signal })
  return data
}

// Avancement de plusieurs trajets (100 au plus par appel : on découpe en lots)
export async function getTripProgressList(reservationIds, { signal } = {}) {
  const batches = []
  for (let index = 0; index < reservationIds.length; index += 100) batches.push(reservationIds.slice(index, index + 100))
  const results = await Promise.all(
    batches.map((ids) => api.get('/trip-progress', { params: { reservation_ids: ids }, signal })),
  )
  return results.flatMap((response) => response.data.data)
}

// Enregistre une étape : { type, position, actual_nb_children?, actual_nb_adults? }.
// 201 nouvelle étape, 200 déjà enregistrée (double appui) ; renvoie { data: étape, meta: { created, progress, trip_report } }
export async function recordTripEvent(reservationId, body) {
  const { data } = await api.post(`/reservations/${reservationId}/trip-events`, body)
  return data
}

// Annule la dernière étape, si c'est bien `type` (l'étape affichée comme dernière) : { data: étape annulée,
// meta: { progress } }. 422 s'il n'y a pas d'étape, si `type` n'est plus la dernière (double clic : rien n'est
// annulé) ou si le compte rendu existe déjà (on corrige alors le compte rendu).
export async function cancelLastTripEvent(reservationId, type) {
  const { data } = await api.delete(`/reservations/${reservationId}/trip-events/last`, { params: { type } })
  return data
}
