import { api } from './client'
import { toApiDate } from '../lib/dates'
import { TERMINAL_STATUSES, tripKey } from '../lib/reservations'

// Liste paginée (15 par page) : renvoie { data, meta, links }.
// params : status, organization_id, date_from, date_to (AAAA-MM-JJ), sort (asc|desc), page
export async function getReservations(params = {}, { signal } = {}) {
  const { data } = await api.get('/reservations', { params, signal })
  return data
}

// Plusieurs compteurs en un appel : `filters` communs (date_from, date_to, organization_id, q) et `counters`
// { nom: { statuses, council, unassigned, passengers_to_confirm } } (12 au plus) → { nom: nombre }
export async function getReservationCounts(filters, counters, { signal } = {}) {
  const { data } = await api.get('/reservations/counts', { params: { ...filters, counts: counters }, signal })
  return data.data
}

export async function getReservation(id, { signal } = {}) {
  const { data } = await api.get(`/reservations/${id}`, { signal })
  return data.data
}

// `idempotencyKey` : un UUID par action utilisateur, réutilisé si la requête est relancée
export async function cancelReservation(id, reason, idempotencyKey) {
  const { data } = await api.patch(
    `/reservations/${id}/cancel`,
    { reason },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return data.data
}

export async function confirmPassengers(id, { nb_children, nb_adults, trip_purpose }) {
  const { data } = await api.patch(`/reservations/${id}/confirm-passengers`, {
    nb_children: Number(nb_children),
    nb_adults: Number(nb_adults),
    trip_purpose,
  })
  return data.data
}

// Prochain trajet non annulé ni refusé, à partir d'aujourd'hui.
// Demande le tri croissant (sort=asc) ; tant que le backend l'ignore, la liste arrive en ordre
// décroissant : on parcourt alors les pages depuis la fin. Au plus MAX_PAGES requêtes.
const MAX_PAGES = 4

export async function getNextTrip({ signal } = {}) {
  const params = { date_from: toApiDate(new Date()), sort: 'asc' }
  const first = await getReservations(params, { signal })
  const lastPage = first.meta.last_page
  const descending = first.data.length > 1 && tripKey(first.data[0]) > tripKey(first.data[first.data.length - 1])

  const pickNext = (items) =>
    items
      .filter((reservation) => !TERMINAL_STATUSES.includes(reservation.status))
      .sort((a, b) => tripKey(a).localeCompare(tripKey(b)))[0] ?? null

  const pages = descending
    ? Array.from({ length: Math.min(lastPage, MAX_PAGES) }, (_, index) => lastPage - index)
    : Array.from({ length: Math.min(lastPage, MAX_PAGES) }, (_, index) => index + 1)

  for (const page of pages) {
    const items = page === 1 ? first.data : (await getReservations({ ...params, page }, { signal })).data
    const next = pickNext(items)
    if (next) return next
  }
  return null
}

// Même corps que la création ; ne modifie rien. Une règle bloquante renvoie 422.
export async function previewReservation(payload, { signal } = {}) {
  const { data } = await api.post('/reservations/preview', payload, { signal })
  return data.data
}

// Modification (demandeur ou responsable, statut en_attente ou en_conflit). Corps partiel accepté.
export async function updateReservation(id, payload) {
  const { data } = await api.patch(`/reservations/${id}`, payload)
  return data.data
}

export async function createReservation(payload, idempotencyKey) {
  const { data } = await api.post('/reservations', payload, { headers: { 'Idempotency-Key': idempotencyKey } })
  return data.data
}

// Vérification du trajet seul (étape 1 de l'assistant), sans passagers ni motif.
// Utilise POST /reservations/check-trip ; tant que le backend ne l'a pas (404), repli sur le
// preview avec des valeurs provisoires pour les passagers (la capacité est vérifiée à l'étape 3).
const TRIP_CHECK_PLACEHOLDERS = { nb_children: 0, nb_adults: 1, trip_purpose: 'Vérification du trajet' }
let checkTripRouteMissing = false

export async function checkTrip(trip, { signal } = {}) {
  if (!checkTripRouteMissing) {
    try {
      const { data } = await api.post('/reservations/check-trip', trip, { signal })
      return data.data
    } catch (error) {
      if (error.response?.status !== 404) throw error
      checkTripRouteMissing = true
    }
  }
  return previewReservation({ ...trip, ...TRIP_CHECK_PLACEHOLDERS }, { signal })
}

// ----- Actions des agents (espace gestion) -----

// Approuver : lance l'affectation automatique (passe en « confirme » si un chauffeur et un véhicule sont libres)
export async function approveReservation(id) {
  const { data } = await api.patch(`/reservations/${id}/approve`)
  return data.data
}

export async function rejectReservation(id, reason) {
  const { data } = await api.patch(`/reservations/${id}/reject`, { reason })
  return data.data
}

// Affectation manuelle d'un chauffeur et/ou d'un véhicule (le backend vérifie disponibilités et capacité)
export async function assignReservation(id, { driver_id, vehicle_id, reason }, idempotencyKey) {
  const { data } = await api.patch(
    `/reservations/${id}/assign`,
    { driver_id: driver_id || undefined, vehicle_id: vehicle_id || undefined, reason: reason || undefined },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return data.data
}

// Confirmer : statut « approuve », chauffeur et véhicule affectés, aucun conflit ouvert
export async function confirmReservation(id) {
  const { data } = await api.patch(`/reservations/${id}/confirm`)
  return data.data
}

// Relancer l'affectation automatique (ex. après la levée d'une indisponibilité)
export async function retryAssignReservation(id) {
  const { data } = await api.patch(`/reservations/${id}/retry-assign`)
  return data.data
}

export async function resolveReservationConflict(reservationId, conflictId) {
  const { data } = await api.patch(`/reservations/${reservationId}/conflicts/${conflictId}/resolve`)
  return data.data
}
