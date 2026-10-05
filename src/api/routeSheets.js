import { api } from './client'

// Feuilles de route de l'espace chauffeur (PR backend « route sheets driver »).

// Feuilles officielles (journalières, par véhicule), dernière version seulement, 15 par page ; le chauffeur ne
// reçoit que celles qui contiennent au moins une de ses missions (`own_trip_count`). Params : date_from, date_to, page.
export async function getRouteSheets(params = {}, { signal } = {}) {
  const { data } = await api.get('/route-sheets', { params, signal })
  return data
}

// PDF de la semaine du chauffeur connecté (lundi → dimanche contenant `week`), généré à la demande : toujours à jour
export async function downloadDriverWeekSheet(week) {
  const { data } = await api.get('/route-sheets/driver', { params: { week }, responseType: 'blob' })
  return data
}

// Génère une feuille de route officielle (agent et admin) : `{ service_date, vehicle_id }` (un jour, un véhicule)
// ou `{ start_date, end_date }` (période, tous les véhicules). Renvoie le document créé (nouvelle version si elle existait).
export async function generateRouteSheet(body) {
  const { data } = await api.post('/documents/route-sheets/generate', body)
  return data.data
}
