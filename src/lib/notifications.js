import { getHomePath, isInternal } from '../auth/permissions'
import { NOTIFICATION_CATEGORY_LABELS } from './labels'

// Catégories reçues selon le rôle : l'usager reçoit dans « admin_workflow » les réponses
// à ses demandes d'adhésion ou de création ; un agent y reçoit le travail à traiter.
export function notificationCategories(user) {
  if (isInternal(user)) return ['admin_workflow', 'reservation_updates', 'last_minute_cancellation', 'weekly_planning']
  if (getHomePath(user) === '/chauffeur') return ['driver_planning', 'last_minute_cancellation']
  return ['reservation_updates', 'last_minute_cancellation', 'admin_workflow']
}

// État des pastilles de /notifications (?etat=) : toutes, non lues, ou urgentes (priorité haute)
export const NOTIFICATION_STATES = ['non-lues', 'urgentes']

// Le backend refuse une recherche de moins de 2 caractères
export const NOTIFICATION_SEARCH_MIN_LENGTH = 2

// Lit l'URL de /notifications (?etat=non-lues|urgentes&categorie=…&q=…&page=…), valeurs inconnues ignorées
export function readNotificationsSearch(searchParams) {
  const state = searchParams.get('etat')
  return {
    state: NOTIFICATION_STATES.includes(state) ? state : null,
    category: searchParams.get('categorie') || null,
    search: searchParams.get('q') ?? '',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
  }
}

// Filtres de l'API (liste, résumé et « marquer comme lues » reçoivent les mêmes) ; `without` : filtres à ignorer
// (ex. 'category' pour compter chaque catégorie avec les autres filtres)
export function notificationFilterParams({ state, category, search }, without = []) {
  const term = search.trim()
  return {
    ...(state === 'non-lues' && !without.includes('state') && { unread: 1 }),
    ...(state === 'urgentes' && !without.includes('state') && { priority: 'high' }),
    ...(category && !without.includes('category') && { category }),
    ...(term.length >= NOTIFICATION_SEARCH_MIN_LENGTH && { search: term }),
  }
}

export function categoryLabel(category, user) {
  if (category === 'admin_workflow' && !isInternal(user)) return 'Réponses à mes demandes'
  return NOTIFICATION_CATEGORY_LABELS[category] ?? category
}

// Où mène une notification : demande d'aide (liste des agents, ou « Ma journée » du chauffeur), page d'une
// réservation (espace usager pour l'instant) ou document via son lien signé. null si rien à ouvrir.
export function notificationTarget(notification, user) {
  const { reservation_id: reservationId, action_url: actionUrl, event_key: eventKey = '' } = notification.data
  if (eventKey.startsWith('driver_alert.')) {
    return isInternal(user)
      ? { to: '/gestion/alertes', label: 'Voir les demandes d’aide' }
      : { to: '/chauffeur/journee', label: 'Ma journée' }
  }
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

// Nature d'une notification pour son icône et sa couleur, d'après sa clé d'événement
// (« reservation.approved », « user_org_request.rejected »…), sinon d'après sa catégorie
export function notificationKind({ event_key: eventKey = '', category }) {
  if (eventKey.startsWith('driver_alert.')) return 'alert'
  if (eventKey === 'organization.banned') return 'refused'
  if (eventKey === 'organization.unbanned') return 'approved'
  if (/(rejected|refused)$/.test(eventKey)) return 'refused'
  if (/cancelled$/.test(eventKey)) return 'cancelled'
  if (/(approved|confirmed|accepted)$/.test(eventKey) && !eventKey.includes('passengers')) return 'approved'
  if (eventKey.includes('passengers')) return 'passengers'
  if (eventKey.startsWith('document.')) return 'document'
  if (eventKey.includes('conflict')) return 'conflict'
  if (category === 'last_minute_cancellation') return 'cancelled'
  if (category === 'admin_workflow') return 'organization'
  if (category === 'driver_planning' || category === 'weekly_planning') return 'planning'
  return 'reservation'
}

// Notifications groupées par jour de réception (heure de Bruxelles) : aujourd'hui, hier,
// cette semaine (7 derniers jours), plus anciennes ; groupes vides écartés
export function groupByDay(notifications, now = new Date()) {
  const day = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(date)
  const today = day(now)
  const shift = (days) => {
    const date = new Date(now)
    date.setDate(date.getDate() - days)
    return day(date)
  }
  const yesterday = shift(1)
  const weekAgo = shift(7)
  const groups = [
    { key: 'today', label: 'Aujourd’hui', items: [] },
    { key: 'yesterday', label: 'Hier', items: [] },
    { key: 'week', label: 'Cette semaine', items: [] },
    { key: 'older', label: 'Plus anciennes', items: [] },
  ]
  for (const notification of notifications) {
    const received = day(new Date(notification.created_at))
    const group = received === today ? 0 : received === yesterday ? 1 : received > weekAgo ? 2 : 3
    groups[group].items.push(notification)
  }
  return groups.filter((group) => group.items.length > 0)
}
