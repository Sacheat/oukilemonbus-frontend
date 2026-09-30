import { api } from './client'
import { fetchAllPages } from './pagination'

export async function getDrivers(params = {}, { signal } = {}) {
  const { data } = await api.get('/drivers', { params, signal })
  return data
}

// Tous les chauffeurs, toutes pages confondues (pour savoir quels comptes sont déjà chauffeurs)
export function getAllDrivers({ signal } = {}) {
  return fetchAllPages((page, options) => getDrivers({ page }, options), { signal })
}

// Crée le profil chauffeur d'un compte existant ; le backend lui donne le rôle chauffeur.
// Aucun compte choisi : null (et non Number('') = 0) pour recevoir « L'utilisateur est obligatoire. »
export async function createDriver({ user_id, licence_number, licence_expiry_date }) {
  const { data } = await api.post('/drivers', {
    user_id: user_id ? Number(user_id) : null,
    licence_number,
    licence_expiry_date,
  })
  return data.data
}

// Champs partiels : on n'envoie que ce qui a changé (licence_number, licence_expiry_date)
export async function updateDriver(driverId, changes) {
  const { data } = await api.patch(`/drivers/${driverId}`, changes)
  return data.data
}

// Réactiver (permission drivers.update)
export async function activateDriver(driverId) {
  const { data } = await api.patch(`/drivers/${driverId}/activate`)
  return data.data
}

// Désactiver (permission drivers.deactivate) : pas de suppression
export async function deactivateDriver(driverId) {
  const { data } = await api.patch(`/drivers/${driverId}/deactivate`)
  return data.data
}
