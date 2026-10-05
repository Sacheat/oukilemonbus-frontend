import { AlertTriangle, Bus, CalendarDays, CalendarOff, Gavel, Hourglass, Inbox, UserPlus, Users } from 'lucide-react'
import { periodLength, todayInBrussels } from './planning'

// Tuiles « À traiter » du tableau de bord, dans l'ordre d'affichage. `key` : compteur de `to_process` (GET /dashboard) ;
// `to` et `permission` : liste où le traiter, cliquable seulement avec la permission. Sans `to` : chiffre seul
// (les passagers sont confirmés par le demandeur, l'agent n'a rien à faire dans l'application).
export const TO_PROCESS_TILES = [
  {
    key: 'pending',
    icon: Hourglass,
    tone: 'warning',
    labels: ['réservation en attente', 'réservations en attente'],
    to: '/gestion/reservations?file=en-attente',
    permission: 'reservations.approve',
  },
  {
    key: 'in_conflict',
    icon: AlertTriangle,
    tone: 'conflict',
    labels: ['réservation en conflit', 'réservations en conflit'],
    to: '/gestion/reservations?file=en-conflit',
    permission: 'reservations.approve',
  },
  {
    key: 'awaiting_assignment',
    icon: Bus,
    tone: 'info',
    labels: ['réservation à affecter', 'réservations à affecter'],
    to: '/gestion/reservations?file=a-affecter',
    permission: 'reservations.approve',
  },
  {
    key: 'council_pending',
    icon: Gavel,
    tone: 'primary',
    labels: ['décision du Collège à encoder', 'décisions du Collège à encoder'],
    to: '/gestion/college',
    permission: 'council-decisions.create',
  },
  {
    key: 'passengers_to_confirm',
    icon: Users,
    tone: 'neutral',
    labels: ['trajet sans passagers confirmés (14 j)', 'trajets sans passagers confirmés (14 j)'],
  },
  {
    key: 'join_requests_pending',
    icon: UserPlus,
    tone: 'primary',
    labels: ['demande d’adhésion', 'demandes d’adhésion'],
    to: '/gestion/demandes',
    permission: 'org-registration-requests.review',
  },
  {
    key: 'registration_requests_pending',
    icon: Inbox,
    tone: 'primary',
    labels: ['demande de création d’organisation', 'demandes de création d’organisation'],
    to: '/gestion/demandes',
    permission: 'org-registration-requests.review',
  },
]

// Actions rapides du bandeau, dans l'ordre (la première en bouton principal), affichées selon la permission
export const QUICK_ACTIONS = [
  {
    to: '/gestion/indisponibilites?indisponibilite=nouvelle',
    label: 'Nouvelle indisponibilité',
    icon: CalendarOff,
    permission: 'unavailabilities.create',
  },
  { to: '/gestion/planning', label: 'Planning de la semaine', icon: CalendarDays, permission: 'reservations.view' },
  { to: '/gestion/college', label: 'Décisions du Collège', icon: Gavel, permission: 'council-decisions.create' },
]

// Libellé au singulier pour 0 ou 1, au pluriel au-delà
export function countLabel(count, [singular, plural]) {
  return count > 1 ? plural : singular
}

// Planning ouvert en liste sur un seul jour (aussi pour le week-end, absent de la vue semaine),
// avec un trajet ouvert dans le panneau si `tripId` est donné
export function planningDayLink(day, tripId) {
  const params = new URLSearchParams({ vue: 'liste', du: day, au: day })
  if (tripId) params.set('trajet', String(tripId))
  return `/gestion/planning?${params}`
}

// Barres de l'histogramme : hauteur relative au jour le plus chargé (en %), aujourd'hui repéré
export function weekBars(tripsByDay, today = todayInBrussels()) {
  const max = Math.max(1, ...tripsByDay.map((day) => day.count))
  return tripsByDay.map((day) => ({ ...day, height: (day.count / max) * 100, isToday: day.date === today }))
}

// État du permis d'un chauffeur de l'alerte : expiré (date passée) ou nombre de jours restants
export function licenceAlert(expiryDate, today = todayInBrussels()) {
  if (expiryDate < today) return { expired: true, days: 0 }
  return { expired: false, days: periodLength(today, expiryDate) - 1 }
}

// Nom court de chaque tuile, pour la ligne « Rien en attente » qui regroupe les compteurs à zéro
export const TILE_SHORT_LABELS = {
  pending: 'réservations en attente',
  in_conflict: 'conflits',
  awaiting_assignment: 'affectations',
  council_pending: 'décisions du Collège',
  passengers_to_confirm: 'passagers à confirmer',
  join_requests_pending: 'demandes d’adhésion',
  registration_requests_pending: 'créations d’organisation',
}

// Tuiles à mettre en avant (compteur non nul) et compteurs à zéro, repliés en une ligne
export function splitTiles(toProcess) {
  const active = TO_PROCESS_TILES.filter((tile) => toProcess[tile.key] > 0)
  const empty = TO_PROCESS_TILES.filter((tile) => !(toProcess[tile.key] > 0))
  return { active, empty }
}

// Demandes sur lesquelles un agent peut agir (sans les passagers, que confirme le demandeur)
function actionableCount(toProcess) {
  return TO_PROCESS_TILES.filter((tile) => tile.to).reduce((total, tile) => total + (toProcess[tile.key] ?? 0), 0)
}

// La journée en une phrase pour le bandeau : « 3 demandes à traiter, 2 trajets aujourd'hui dont 1 non affecté,
// 1 alerte flotte. »
export function daySummary({ to_process: toProcess, today, fleet_alerts: alerts }) {
  const parts = []
  const toDo = actionableCount(toProcess)
  parts.push(toDo === 0 ? 'Aucune demande à traiter' : `${toDo} ${countLabel(toDo, ['demande à traiter', 'demandes à traiter'])}`)

  const tripCount = today.trips_count
  if (tripCount === 0) {
    parts.push('aucun trajet aujourd’hui')
  } else {
    const unassigned = today.trips.filter((trip) => !trip.driver || !trip.vehicle).length
    const tripsText = `${tripCount} ${countLabel(tripCount, ['trajet', 'trajets'])} aujourd’hui`
    if (unassigned > 0) parts.push(`${tripsText} dont ${unassigned} non ${countLabel(unassigned, ['affecté', 'affectés'])}`)
    else parts.push(`${tripsText}, ${tripCount > 1 ? 'tous affectés' : 'affecté'}`)
  }

  const alertCount =
    (alerts.vehicles_unavailable_today > 0 ? 1 : 0) +
    (alerts.drivers_unavailable_today > 0 ? 1 : 0) +
    (alerts.inactive_vehicles > 0 ? 1 : 0) +
    alerts.licences_expiring_30_days.length
  if (alertCount > 0) parts.push(`${alertCount} ${countLabel(alertCount, ['alerte flotte', 'alertes flotte'])}`)

  return `${parts.join(', ')}.`
}

// "08:15:00" ou "08:15" → minutes depuis minuit
export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Trajets confirmés en cours (départ passé, retour à venir) et prochain départ confirmé de la journée.
// `nowTime` : heure actuelle à Bruxelles "HH:mm". Les trajets non confirmés ne partent pas : ils sont ignorés.
export function tripsNow(trips, nowTime) {
  const now = toMinutes(nowTime)
  const confirmed = trips.filter((trip) => trip.status === 'confirme')
  return {
    onTheRoad: confirmed.filter((trip) => toMinutes(trip.departure_time) <= now && now < toMinutes(trip.return_time)),
    next: confirmed.find((trip) => toMinutes(trip.departure_time) > now) ?? null,
  }
}

// « dans 45 min », « dans 2 h 10 »
export function minutesUntil(time, nowTime) {
  const minutes = toMinutes(time) - toMinutes(nowTime)
  if (minutes < 60) return `dans ${minutes} min`
  const rest = minutes % 60
  return `dans ${Math.floor(minutes / 60)} h${rest ? ` ${String(rest).padStart(2, '0')}` : ''}`
}

const DAY_START = 7 * 60
const DAY_END = 19 * 60

// Frise de la journée : une ligne par bus (par plaque, « Non affecté » en dernier), de 7 h à 19 h au moins
// (élargie aux trajets plus tôt ou plus tard). Deux trajets qui se chevauchent sur le même bus vont sur deux
// sous-lignes. Positions en % ; `now` : position du trait « maintenant », null hors de la plage.
export function dayTimeline(trips, nowTime) {
  const start = Math.min(DAY_START, ...trips.map((trip) => Math.floor(toMinutes(trip.departure_time) / 60) * 60))
  const end = Math.max(DAY_END, ...trips.map((trip) => Math.ceil(toMinutes(trip.return_time) / 60) * 60))
  const position = (minutes) => ((minutes - start) / (end - start)) * 100
  const now = toMinutes(nowTime)

  const groups = new Map()
  for (const trip of [...trips].sort((first, second) => first.departure_time.localeCompare(second.departure_time))) {
    const key = trip.vehicle ? `vehicle-${trip.vehicle.id}` : 'unassigned'
    if (!groups.has(key)) groups.set(key, { key, label: trip.vehicle?.licence_plate ?? 'Non affecté', lanes: [] })
    const { lanes } = groups.get(key)
    const departure = toMinutes(trip.departure_time)
    const lane = lanes.find((items) => toMinutes(items.at(-1).trip.return_time) <= departure)
    const bar = {
      trip,
      left: position(departure),
      width: position(toMinutes(trip.return_time)) - position(departure),
      past: toMinutes(trip.return_time) <= now,
      live: trip.status === 'confirme' && departure <= now && now < toMinutes(trip.return_time),
    }
    if (lane) lane.push(bar)
    else lanes.push([bar])
  }

  const rows = [...groups.values()].sort((first, second) => {
    if (first.key === 'unassigned') return 1
    if (second.key === 'unassigned') return -1
    return first.label.localeCompare(second.label)
  })
  const hours = []
  for (let minutes = Math.ceil(start / 120) * 120; minutes <= end; minutes += 120) {
    hours.push({ label: `${minutes / 60} h`, left: position(minutes) })
  }

  return { rows, hours, now: now >= start && now <= end ? position(now) : null }
}
