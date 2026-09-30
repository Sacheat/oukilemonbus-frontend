import { toApiDate } from './dates'
import { canConfirmPassengers, todayApiDate } from './reservations'

// « Bonjour » en journée, « Bonsoir » à partir de 18 h (et la nuit)
export function greeting(now = new Date()) {
  const hour = now.getHours()
  return hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir'
}

// Jours entre aujourd'hui et une date AAAA-MM-JJ → « aujourd'hui », « demain », « dans 3 jours »
export function countdown(tripDate, now = new Date()) {
  const today = new Date(`${toApiDate(now)}T00:00:00`)
  const days = Math.round((new Date(`${tripDate}T00:00:00`) - today) / 86_400_000)
  if (days <= 0) return 'aujourd’hui'
  if (days === 1) return 'demain'
  return `dans ${days} jours`
}

// Fenêtre de l'accueil pour les passagers à confirmer
export const PASSENGERS_WINDOW_DAYS = 14

export function passengersWindowEnd(now = new Date()) {
  const end = new Date(now)
  end.setDate(end.getDate() + PASSENGERS_WINDOW_DAYS)
  return toApiDate(end)
}

// Ce qui attend l'usager, du plus urgent au moins urgent (5 au plus)
// - trajets en conflit ; - passagers à confirmer d'ici 14 jours ; - demandes en cours
export function todoItems({ user, conflicts = [], upcoming = [], pendingRequests = [] }) {
  const today = todayApiDate()
  const items = []

  if (!user.organizations?.length) {
    items.push({ key: 'org', tone: 'warning', title: 'Rejoindre une organisation', detail: 'Indispensable pour réserver le bus.', to: '/espace/organisations' })
  }
  for (const reservation of conflicts) {
    items.push({
      key: `conflict-${reservation.id}`,
      tone: 'conflict',
      title: `Trajet en conflit : ${reservation.trip_purpose}`,
      detail: 'La commune règle le problème ; vous pouvez modifier les horaires.',
      date: reservation.trip_date,
      to: `/espace/deplacements/${reservation.id}`,
    })
  }
  for (const reservation of upcoming) {
    if (reservation.trip_date < today || reservation.passengers_confirmed_at) continue
    if (!canConfirmPassengers(user, reservation)) continue
    items.push({
      key: `passengers-${reservation.id}`,
      tone: 'info',
      title: `Confirmer les passagers : ${reservation.trip_purpose}`,
      detail: 'Indiquez le nombre définitif avant le départ.',
      date: reservation.trip_date,
      to: `/espace/deplacements/${reservation.id}`,
    })
  }
  for (const { kind, request } of pendingRequests) {
    items.push({
      key: `${kind}-${request.request_id ?? request.id}`,
      tone: 'neutral',
      title: kind === 'adhesion' ? `Demande d’adhésion : ${request.organization?.name ?? 'organisation'}` : `Création de ${request.organization_name}`,
      detail: 'En cours d’examen par la commune.',
      to: '/espace/organisations',
    })
  }
  return items.slice(0, 5)
}
