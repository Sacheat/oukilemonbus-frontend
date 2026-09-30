import { getReservations } from '../api/reservations'
import { formatDate, toApiDate } from './dates'
import { todayApiDate } from './reservations'

// Couleur du point de la ligne du temps et des jours du calendrier, par statut
export const STATUS_DOTS = {
  en_attente: 'bg-warning',
  approuve: 'bg-info',
  confirme: 'bg-success',
  en_conflit: 'bg-conflict',
  refuse: 'bg-danger',
  annule: 'bg-neutral',
}

// Pastilles de filtre, dans l'ordre d'affichage (`value` null : tous les statuts)
export const STATUS_CHIPS = [
  { value: null, label: 'Tous' },
  { value: 'confirme', label: 'Confirmés' },
  { value: 'approuve', label: 'Approuvés' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_conflit', label: 'En conflit' },
  { value: 'annule', label: 'Annulés' },
  { value: 'refuse', label: 'Refusés' },
]

// Nombre de trajets par statut pour les filtres courants (sans le statut ni la page)
export async function fetchStatusCounts(baseParams, { signal } = {}) {
  const pages = await Promise.all(
    STATUS_CHIPS.map((chip) =>
      getReservations({ ...baseParams, ...(chip.value ? { status: chip.value } : {}), page: 1 }, { signal }),
    ),
  )
  return Object.fromEntries(STATUS_CHIPS.map((chip, index) => [chip.value ?? 'tous', pages[index].meta.total]))
}

// Tous les trajets d'un mois (pages parcourues jusqu'à 5, soit 75 trajets)
export async function fetchMonthTrips(monthStart, { signal, organizationId } = {}) {
  const start = new Date(`${monthStart}T00:00:00`)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  const params = { date_from: toApiDate(start), date_to: toApiDate(end), sort: 'asc' }
  if (organizationId) params.organization_id = organizationId
  const trips = []
  for (let page = 1; page <= 5; page += 1) {
    const result = await getReservations({ ...params, page }, { signal })
    trips.push(...result.data)
    if (page >= result.meta.last_page) break
  }
  return trips
}

// Regroupe la liste (déjà triée) par mois ; ajoute un repère « Aujourd'hui » entre passé et à venir
// quand la liste mélange les deux. Renvoie [{ key, label, items: [{ type: 'trip' | 'today', … }] }]
export function groupByMonth(reservations) {
  const today = todayApiDate()
  const groups = []
  let markerPlaced = false
  const ascending = reservations.length < 2 || reservations[0].trip_date <= reservations.at(-1).trip_date
  const hasPast = reservations.some((reservation) => reservation.trip_date < today)
  const hasFuture = reservations.some((reservation) => reservation.trip_date >= today)

  for (const reservation of reservations) {
    const key = reservation.trip_date.slice(0, 7)
    let group = groups.at(-1)
    if (!group || group.key !== key) {
      group = { key, label: formatDate(`${key}-01`, { month: 'long', year: 'numeric' }), items: [] }
      groups.push(group)
    }
    const isFuture = reservation.trip_date >= today
    // Tri croissant : repère avant le premier trajet à venir ; décroissant : avant le premier trajet passé
    if (hasPast && hasFuture && !markerPlaced && (ascending ? isFuture : !isFuture)) {
      group.items.push({ type: 'today', key: 'today' })
      markerPlaced = true
    }
    group.items.push({ type: 'trip', key: reservation.id, reservation })
  }
  return groups
}
