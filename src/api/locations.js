import { api } from './client'

// Autocomplétion d'adresses belges (6 max, [] sous 3 caractères). 30 requêtes / min : debounce côté appelant.
export async function suggestLocations(q, { signal } = {}) {
  const { data } = await api.get('/locations/suggest', { params: { q }, signal })
  return data.data
}

// Lieux déjà enregistrés (recherche sur l'adresse et la ville, 10 par page)
export async function searchLocations(q, { signal } = {}) {
  const { data } = await api.get('/locations', { params: { q }, signal })
  return data.data
}

// Enregistre une suggestion (renvoyée telle quelle, sans `label`). Le backend réutilise
// un lieu existant qui a le même place_id.
export async function createLocation(suggestion) {
  // eslint-disable-next-line no-unused-vars
  const { label, ...location } = suggestion
  const { data } = await api.post('/locations', location)
  return data.data
}
