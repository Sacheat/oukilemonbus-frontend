import { api } from './client'

// « Ma journée » : journée du chauffeur en un appel, réglages de la commune et tracé réel d'un trajet.

// Tout « Ma journée » pour un jour (AAAA-MM-JJ), en un appel (backend feature/chauffeur-journee-un-appel) :
// { date, missions (format de GET /reservations), progress (format de GET /trip-progress), previous_day, next_day,
//   settings (format de GET /driver-journey/settings) }
export async function getDriverDay(date, { signal } = {}) {
  const { data } = await api.get('/driver-journey/day', { params: { date }, signal })
  return data.data
}

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
