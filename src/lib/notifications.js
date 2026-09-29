import { getHomePath, isInternal } from '../auth/permissions'
import { NOTIFICATION_CATEGORY_LABELS } from './labels'

// Catégories reçues selon le rôle : l'usager reçoit dans « admin_workflow » les réponses
// à ses demandes d'adhésion ou de création ; un agent y reçoit le travail à traiter.
export function notificationCategories(user) {
  if (isInternal(user)) return ['admin_workflow', 'reservation_updates', 'last_minute_cancellation']
  if (getHomePath(user) === '/chauffeur') return ['driver_planning', 'last_minute_cancellation']
  return ['reservation_updates', 'last_minute_cancellation', 'admin_workflow']
}

export function categoryLabel(category, user) {
  if (category === 'admin_workflow' && !isInternal(user)) return 'Réponses à mes demandes'
  return NOTIFICATION_CATEGORY_LABELS[category] ?? category
}

// Où mène une notification : page d'une réservation (espace usager pour l'instant)
// ou document via son lien signé. null si rien à ouvrir.
export function notificationTarget(notification, user) {
  const { reservation_id: reservationId, action_url: actionUrl } = notification.data
  if (actionUrl) return { href: actionUrl, label: 'Ouvrir le document' }
  if (reservationId && getHomePath(user) === '/espace') {
    return { to: `/espace/deplacements/${reservationId}`, label: 'Voir la réservation' }
  }
  return null
}

export const DIGEST_OPTIONS = [
  { value: 'none', label: 'Chaque e-mail tout de suite' },
  { value: 'hourly', label: 'Un résumé par heure' },
  { value: 'daily', label: 'Un résumé par jour (le matin)' },
]

export const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: String(hour), label: `${String(hour).padStart(2, '0')}:00` }))
