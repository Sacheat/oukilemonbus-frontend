import { api } from './client'
import { toApiDate } from '../lib/dates'
import { TERMINAL_STATUSES, tripKey } from '../lib/reservations'

// Liste paginée (15 par page) : renvoie { data, meta, links }.
// params : status, organization_id, date_from, date_to (AAAA-MM-JJ), sort (asc|desc), page
export async function getReservations(params = {}, { signal } = {}) {
  const { data } = await api.get('/reservations', { params, signal })
  return data
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
