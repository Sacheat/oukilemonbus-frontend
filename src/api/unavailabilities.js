import { toLocalApiDateTime } from '../lib/dates'
import { api } from './client'

export async function getUnavailabilities(params = {}, { signal } = {}) {
  const { data } = await api.get('/unavailabilities', { params, signal })
  return data
}

// Une page d'un onglet, filtrée, triée et paginée par le backend (les indisponibilités s'accumulent avec les années) :
// { data, meta: { current_page, last_page, total, period_counts: { a_venir, passees, annulees } } }.
// `params` : voir unavailabilityListParams (lib/unavailabilities.js).
export function getUnavailabilityPage(params, { signal } = {}) {
  return getUnavailabilities(params, { signal })
}

// Une indisponibilité (panneau de détail), avec le nom du chauffeur ou la plaque du véhicule
export async function getUnavailability(unavailabilityId, { signal } = {}) {
  const { data } = await api.get(`/unavailabilities/${unavailabilityId}`, { signal })
  return data.data
}

// Historique des modifications et de l'annulation, plus récentes d'abord (15 par page) : old_* / new_* (heures locales
// sans fuseau), change_reason, changed_by { id, name } (null si le compte n'existe plus), created_at (UTC)
export async function getUnavailabilityHistory(unavailabilityId, { page = 1 } = {}, { signal } = {}) {
  const { data } = await api.get(`/unavailabilities/${unavailabilityId}/history`, { params: { page }, signal })
  return data
}

// Corps commun à la création et à la modification.
// Début et fin : heure de Bruxelles envoyée telle quelle, sans fuseau ("2026-07-10T08:00:00"), comme le backend
// les stocke et les compare aux réservations. Selon le type, seul driver_id ou vehicle_id est rempli (jamais les deux).
function unavailabilityBody(values) {
  return {
    reason_type: values.reason_type || null,
    driver_id: values.reason_type === 'driver' && values.driver_id ? Number(values.driver_id) : null,
    vehicle_id: values.reason_type === 'vehicle' && values.vehicle_id ? Number(values.vehicle_id) : null,
    reason: values.reason.trim() || null,
    start_datetime: toLocalApiDateTime(values.start_datetime) || null,
    end_datetime: toLocalApiDateTime(values.end_datetime) || null,
  }
}

// Les réservations touchées perdent leur affectation et passent en conflit (la réponse ne dit pas lesquelles)
export async function createUnavailability(values) {
  const { data } = await api.post('/unavailabilities', unavailabilityBody(values))
  return data.data
}

// change_reason est conservé dans l'historique de l'indisponibilité
export async function updateUnavailability(unavailabilityId, values) {
  const { data } = await api.patch(`/unavailabilities/${unavailabilityId}`, {
    ...unavailabilityBody(values),
    change_reason: values.change_reason.trim() || null,
  })
  return data.data
}

// Annuler : l'indisponibilité est conservée avec is_active = false
export async function cancelUnavailability(unavailabilityId) {
  const { data } = await api.patch(`/unavailabilities/${unavailabilityId}/cancel`)
  return data.data
}
