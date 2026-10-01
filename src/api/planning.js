import { api } from './client'

// Trajets d'une période (31 jours au plus), non paginé : { period, filters, data: PlanningItem[] }.
// Paramètres : start_date, end_date, statuses[], vehicle_id, driver_id, include_availability (1 : chauffeurs et
// véhicules libres pour chaque trajet, réservé aux rôles internes). Sans `statuses`, le backend n'affiche que
// approuve, confirme et en_conflit : le front envoie donc toujours la liste voulue.
export async function getPlanning(params, { signal } = {}) {
  const { data } = await api.get('/planning', { params, signal })
  return data
}

// Export Excel préparé en tâche de fond : 202 avec un PlanningExport en « pending »
export async function requestPlanningExport(params) {
  const { data } = await api.post('/planning/exports', params)
  return data.data
}

// État d'un export : pending, processing, succeeded (avec document_id) ou failed (avec error_message)
export async function getPlanningExport(exportId) {
  const { data } = await api.get(`/planning/exports/${exportId}`)
  return data.data
}

// Chauffeurs et véhicules libres ou non pour une réservation (rôles internes) :
// { drivers: { available, unavailable }, vehicles: { available, unavailable } }, chaque entrée avec
// is_available et unavailable_reason. null si la réservation n'apparaît pas dans le planning du jour.
export async function getReservationAvailability(reservation, { signal } = {}) {
  const { data } = await getPlanning(
    // Le planning n'inclut pas tous les statuts par défaut (ex. « en_attente ») : on demande celui de la réservation
    { start_date: reservation.trip_date, end_date: reservation.trip_date, include_availability: 1, statuses: [reservation.status] },
    { signal },
  )
  return data.find((item) => item.reservation_id === reservation.id)?.availability ?? null
}
