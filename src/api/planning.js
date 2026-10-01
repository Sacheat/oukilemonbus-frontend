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
