import { AlertTriangle, Bus, CalendarDays, CalendarOff, Gavel, Hourglass, Inbox, ListChecks, UserPlus } from 'lucide-react'
import { PROGRESS_BADGES } from './driverJourney'
import { periodLength, todayInBrussels } from './planning'

// Tuiles « À faire » du tableau de bord, dans l'ordre d'affichage : uniquement ce sur quoi l'agent peut agir.
// `inTotal: false` : compteur déjà inclus dans un autre (pas additionné dans le total du bandeau).
// `key` : compteur de `to_process` (GET /dashboard) ; `labels` disent l'action (« à valider ») ;
// `to` et `permission` : liste où le traiter, cliquable seulement avec la permission.
export const TO_PROCESS_TILES = [
  {
    key: 'pending',
    icon: Hourglass,
    tone: 'warning',
    labels: ['réservation à valider', 'réservations à valider'],
    to: '/gestion/reservations?file=a-traiter&statut=en-attente',
    permission: 'reservations.approve',
  },
  {
    key: 'in_conflict',
    icon: AlertTriangle,
    tone: 'conflict',
    labels: ['conflit à résoudre', 'conflits à résoudre'],
    to: '/gestion/reservations?file=a-traiter&statut=en-conflit',
    permission: 'reservations.approve',
  },
  {
    key: 'awaiting_assignment',
    icon: Bus,
    tone: 'info',
    labels: ['chauffeur ou bus à affecter', 'chauffeurs ou bus à affecter'],
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
    // Ces réservations sont déjà comptées en attente ou en conflit : pas recomptées dans le total du bandeau
    inTotal: false,
  },
  {
    key: 'join_requests_pending',
    icon: UserPlus,
    tone: 'primary',
    labels: ['demande d’adhésion à examiner', 'demandes d’adhésion à examiner'],
    to: '/gestion/demandes?file=adhesions',
    permission: 'org-registration-requests.review',
  },
  {
    key: 'registration_requests_pending',
    icon: Inbox,
    tone: 'primary',
    labels: ['nouvelle organisation à examiner', 'nouvelles organisations à examiner'],
    to: '/gestion/demandes?file=organisations',
    permission: 'org-registration-requests.review',
  },
]

// Actions rapides du bandeau, dans l'ordre (la première en bouton principal), affichées selon la permission.
// `count: 'queue'` : la première affiche le nombre de réservations à traiter (même chiffre que le menu).
export const QUICK_ACTIONS = [
  {
    to: '/gestion/reservations',
    label: 'Traiter les réservations',
    icon: ListChecks,
    permission: 'reservations.approve',
    count: 'queue',
  },
  { to: '/gestion/planning', label: 'Planning de la semaine', icon: CalendarDays, permission: 'reservations.view' },
  {
    to: '/gestion/indisponibilites?indisponibilite=nouvelle',
    label: 'Nouvelle indisponibilité',
    icon: CalendarOff,
    permission: 'unavailabilities.create',
  },
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

// Tuiles à afficher : compteurs non nuls seulement (« Tout est à jour » quand il n'y en a aucun)
export function activeTiles(toProcess) {
  return TO_PROCESS_TILES.filter((tile) => toProcess[tile.key] > 0)
}

// Demandes sur lesquelles un agent peut agir, chacune comptée une fois : réservations en attente, en conflit et à
// affecter, demandes d'adhésion et de création (les décisions du Collège portent sur des réservations déjà comptées)
function actionableCount(toProcess) {
  return TO_PROCESS_TILES.filter((tile) => tile.inTotal !== false).reduce((total, tile) => total + (toProcess[tile.key] ?? 0), 0)
}

// Section « À surveiller » : ce qui ne demande pas d'action de l'agent tout de suite, mais qu'il doit voir passer
// (passagers que le demandeur doit confirmer, indisponibilités du jour, véhicules désactivés, permis).
// `links` : file « Passagers à confirmer », pages Indisponibilités, Véhicules et Chauffeurs, null sans la permission
// (un permis ouvre la fiche de son chauffeur). Liste vide : rien à signaler.
export function watchItems({ to_process: toProcess, fleet_alerts: alerts }, links, today = todayInBrussels()) {
  const items = []
  const passengers = toProcess.passengers_to_confirm ?? 0
  if (passengers > 0) {
    items.push({
      key: 'passengers',
      kind: 'passengers',
      tone: 'neutral',
      title: `${passengers} ${countLabel(passengers, ['trajet', 'trajets'])} sans passagers confirmés dans les 14 jours`,
      detail: 'Le demandeur doit les confirmer ; vous pouvez le relancer si le trajet approche.',
      to: links.passengers,
    })
  }
  const vehicles = alerts.vehicles_unavailable_today ?? 0
  if (vehicles > 0) {
    items.push({
      key: 'vehicles-unavailable',
      kind: 'unavailable',
      tone: 'warning',
      title: `${vehicles} ${countLabel(vehicles, ['véhicule indisponible', 'véhicules indisponibles'])} aujourd’hui`,
      to: links.unavailabilities,
    })
  }
  const drivers = alerts.drivers_unavailable_today ?? 0
  if (drivers > 0) {
    items.push({
      key: 'drivers-unavailable',
      kind: 'unavailable',
      tone: 'warning',
      title: `${drivers} ${countLabel(drivers, ['chauffeur indisponible', 'chauffeurs indisponibles'])} aujourd’hui`,
      to: links.unavailabilities,
    })
  }
  const inactive = alerts.inactive_vehicles ?? 0
  if (inactive > 0) {
    items.push({
      key: 'inactive-vehicles',
      kind: 'vehicle',
      tone: 'neutral',
      title: `${inactive} ${countLabel(inactive, ['véhicule désactivé', 'véhicules désactivés'])}`,
      to: links.vehicles,
    })
  }
  for (const licence of alerts.licences_expiring_30_days ?? []) {
    const { expired, days } = licenceAlert(licence.licence_expiry_date, today)
    items.push({
      key: `licence-${licence.driver_id}`,
      kind: expired ? 'licence-expired' : 'licence',
      tone: expired ? 'danger' : 'warning',
      title: licence.full_name ?? 'Chauffeur',
      expiryDate: licence.licence_expiry_date,
      expired,
      days,
      to: links.drivers && `${links.drivers}?chauffeur=${licence.driver_id}`,
    })
  }
  return items
}

// La journée en une phrase pour le bandeau : « 3 demandes à traiter, 2 trajets aujourd'hui dont 1 non affecté. »
// (les alertes flotte sont dans « À surveiller », l'avancement dans l'encart « Maintenant »)
export function daySummary({ to_process: toProcess, today }) {
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

  return `${parts.join(', ')}.`
}

// "08:15:00" ou "08:15" → minutes depuis minuit
export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// États du backend (TripProgressState) où le bus a quitté le dépôt et n'est pas encore rentré
const MOVING_STATES = ['en_route_aller', 'sur_place', 'en_route_retour']

// Le chauffeur a-t-il signalé son départ sans être encore rentré ? (`progress` : avancement d'un trajet)
export function isTripMoving(progress) {
  return MOVING_STATES.includes(progress?.state)
}

// Le trajet est-il en route ? D'après les étapes du chauffeur quand on les a (`progress` : avancement du trajet,
// undefined si inconnu), sinon d'après l'horaire (départ passé, retour à venir).
function isOnTheRoad(trip, progress, now) {
  if (progress) return isTripMoving(progress)
  return toMinutes(trip.departure_time) <= now && now < toMinutes(trip.return_time)
}

// Ce qui se passe maintenant, pour l'encart du bandeau. `nowTime` : heure actuelle à Bruxelles "HH:mm" ;
// `progressById` : avancement par reservation_id (GET /trip-progress), null ou undefined s'il n'est pas disponible :
// on se repère alors sur l'horaire (`fromSchedule`). Seuls les trajets confirmés partent.
//   onTheRoad : bus en route ;
//   late      : départ confirmé dont l'heure est passée sans que le chauffeur ait signalé son départ ;
//   next      : prochain départ confirmé.
export function tripsNow(trips, nowTime, progressById) {
  const now = toMinutes(nowTime)
  const confirmed = trips.filter((trip) => trip.status === 'confirme')
  const progressOf = (trip) => progressById?.[trip.id]
  const notStarted = (trip) => !progressOf(trip) || progressOf(trip).state === 'a_venir'
  return {
    fromSchedule: progressById == null,
    onTheRoad: confirmed.filter((trip) => isOnTheRoad(trip, progressOf(trip), now)),
    late: progressById
      ? confirmed.filter(
          (trip) => notStarted(trip) && toMinutes(trip.departure_time) <= now && now < toMinutes(trip.return_time),
        )
      : [],
    next: confirmed.find((trip) => toMinutes(trip.departure_time) > now && notStarted(trip)) ?? null,
  }
}

// Badge d'avancement d'un trajet du jour : étape réelle du chauffeur, ou « Pas encore parti » quand l'heure de départ
// d'un trajet confirmé est passée. null : rien à afficher (à venir, ou avancement inconnu).
export function tripProgressBadge(trip, progress, nowTime) {
  if (!progress) return null
  if (progress.state !== 'a_venir') return PROGRESS_BADGES[progress.state] ?? null
  const now = toMinutes(nowTime)
  if (trip.status === 'confirme' && toMinutes(trip.departure_time) <= now && now < toMinutes(trip.return_time)) {
    return { label: 'Pas encore parti', tone: 'warning' }
  }
  return null
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
// `progressById` : avancement réel (bus en route souligné), sinon l'horaire.
export function dayTimeline(trips, nowTime, progressById) {
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
      live: trip.status === 'confirme' && isOnTheRoad(trip, progressById?.[trip.id], now),
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
