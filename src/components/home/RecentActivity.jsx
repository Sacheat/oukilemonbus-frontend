import { markNotificationRead } from '../../api/notifications'
import { useNotifications } from '../../notifications/useNotifications'
import { NotificationItem } from '../notifications/NotificationItem'

// Trois dernières notifications de l'accueil (même rendu que le panneau de la cloche)
export function RecentActivity({ notifications, onChanged }) {
  const { refreshCount } = useNotifications()

  async function handleRead(notification) {
    await markNotificationRead(notification.id).catch(() => {})
    onChanged()
    refreshCount()
  }

  if (notifications.length === 0) {
    return <p className="px-5 py-6 text-sm text-muted">Aucune notification pour le moment.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onRead={handleRead} compact />
      ))}
    </ul>
  )
}
