import { api } from './client'
import { fetchAllPages, fetchPages } from './pagination'

export async function getDrivers(params = {}, { signal } = {}) {
  const { data } = await api.get('/drivers', { params, signal })
  return data
}

// Un chauffeur, avec son compte (`user`)
export async function getDriver(driverId, { signal } = {}) {
  const { data } = await api.get(`/drivers/${driverId}`, { signal })
  return data.data
}

// Tous les chauffeurs, toutes pages confondues (pour savoir quels comptes sont déjà chauffeurs)
export function getAllDrivers({ signal } = {}) {
  return fetchAllPages((page, options) => getDrivers({ page }, options), { signal })
}

// Chauffeurs actifs (`active=1`), pour les listes de choix : { items, complete } (complete = false si la limite de
// 10 pages a coupé la liste). Les chauffeurs partis restent dans la base pour l'historique, sans encombrer les menus.
export function getActiveDrivers({ signal } = {}) {
  return fetchPages((page, options) => getDrivers({ page, active: 1 }, options), { signal })
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
