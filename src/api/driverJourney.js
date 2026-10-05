import { api } from './client'

// « Ma journée », partie 2 (backend feature/journee-chauffeur-2) : réglages de la commune et tracé réel d'un trajet.

// { navigation_engine: { key, label, android, web, web_from }, departure_window_minutes, step_distance_warning_meters }
export async function getDriverJourneySettings({ signal } = {}) {
  const { data } = await api.get('/driver-journey/settings', { signal })
  return data.data
}

// Tracé de l'aller, calculé par le backend à la première ouverture puis gardé :
// { geometry: [[lat, lng], …], distance_m, duration_s, steps: [{ instruction, name, distance_m, duration_s }] },
// ou null si le tracé ne peut pas être calculé (la carte garde alors la ligne à vol d'oiseau).
export async function getTripRoute(reservationId, { signal } = {}) {
  const { data } = await api.get(`/reservations/${reservationId}/route`, { signal })
  return data.data
}
