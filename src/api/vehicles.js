import { api } from './client'
import { fetchAllPages } from './pagination'

export async function getVehicles(params = {}, { signal } = {}) {
  const { data } = await api.get('/vehicles', { params, signal })
  return data
}

// Tous les véhicules, toutes pages confondues (pour les listes de choix)
export function getAllVehicles({ signal } = {}) {
  return fetchAllPages((page, options) => getVehicles({ page }, options), { signal })
}

// `capacity` inclut le siège du chauffeur
export async function createVehicle({ licence_plate, capacity }) {
  const { data } = await api.post('/vehicles', { licence_plate, capacity: Number(capacity) })
  return data.data
}

export async function updateVehicle(vehicleId, { licence_plate, capacity }) {
  const { data } = await api.patch(`/vehicles/${vehicleId}`, { licence_plate, capacity: Number(capacity) })
  return data.data
}

// Remettre en service (permission vehicles.update)
export async function activateVehicle(vehicleId) {
  const { data } = await api.patch(`/vehicles/${vehicleId}/activate`)
  return data.data
}

// Retirer du service (permission vehicles.deactivate) : pas de suppression
export async function deactivateVehicle(vehicleId) {
  const { data } = await api.patch(`/vehicles/${vehicleId}/deactivate`)
  return data.data
}
