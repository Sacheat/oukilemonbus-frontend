import { api } from './client'

export async function getVehicles(params = {}, { signal } = {}) {
  const { data } = await api.get('/vehicles', { params, signal })
  return data
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
