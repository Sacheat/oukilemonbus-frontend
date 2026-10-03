import { api } from './client'

// Indicateurs du tableau de bord de gestion (permission dashboard.view) : compteurs « à traiter », trajets du jour,
// trajets par jour sur 7 jours (aujourd'hui compris) et alertes flotte. « Aujourd'hui » = jour de Bruxelles.
export async function getDashboard({ signal } = {}) {
  const { data } = await api.get('/dashboard', { signal })
  return data.data
}
