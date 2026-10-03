import { api } from './client'
import { fetchAllPages } from './pagination'

// Communes configurées, la commune active d'abord puis par nom, paginées par 15 ; chacune avec `localities`
// (toutes, actives ou non) et `depot_location`. Une seule commune est active : ses réglages s'appliquent aux réservations.
export async function getMunicipalities(params = {}, { signal } = {}) {
  const { data } = await api.get('/municipalities', { params, signal })
  return data
}

// Création (admin dans l'interface) : `is_active` vrai désactive toutes les autres communes
export async function createMunicipality({ name, postal_code, nis_code, country, is_active }) {
  const { data } = await api.post('/municipalities', {
    name,
    postal_code: postal_code || null,
    nis_code: nis_code || null,
    country: country || 'BE',
    is_active: Boolean(is_active),
  })
  return data.data
}

// Champs partiels : nom, codes, dépôt (`depot_location_id`, lieu géolocalisé), distances max (null = défaut), `is_active`
export async function updateMunicipality(municipalityId, changes) {
  const { data } = await api.patch(`/municipalities/${municipalityId}`, changes)
  return data.data
}

// Synchronise localités et centre de la commune depuis GeoNames (désactive les localités GeoNames disparues)
export async function syncLocalities(municipalityId) {
  const { data } = await api.post(`/municipalities/${municipalityId}/sync-localities`)
  return data.data
}

export async function addLocality(municipalityId, name) {
  const { data } = await api.post(`/municipalities/${municipalityId}/localities`, { name, source: 'manual', is_active: true })
  return data.data
}

// Renommer ou réactiver (`is_active: true`)
export async function updateLocality(localityId, changes) {
  const { data } = await api.patch(`/municipality-localities/${localityId}`, changes)
  return data.data
}

export async function deactivateLocality(localityId) {
  const { data } = await api.patch(`/municipality-localities/${localityId}/deactivate`)
  return data.data
}

// Toutes les communes (quelques-unes par installation) : la commune active est la première
export function getAllMunicipalities({ signal } = {}) {
  return fetchAllPages((page, options) => getMunicipalities({ page }, options), { signal })
}
