import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { cx } from '../../lib/cx'
import { formatRelative } from '../../lib/dates'
import { categoryLabel, notificationTarget } from '../../lib/notifications'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { NotificationIcon } from './NotificationIcon'

// Une notification, avec la pastille d'icône de sa nature (point bleu tant qu'elle n'est pas lue). Ouvrir sa cible (réservation, document) la marque comme lue ;
// sans cible, un bouton « Marquer comme lue ». `compact` : version du panneau de la cloche.
export function NotificationItem({ notification, onRead, onNavigate, compact = false }) {
  const { user } = useAuth()
  const { title, message, category, priority } = notification.data
  const unread = !notification.read_at
  const target = notificationTarget(notification, user)

  function handleOpen() {
    if (unread) onRead(notification)
    onNavigate?.()
  }

  const titleClass = cx('font-bold text-ink', compact ? 'text-sm' : 'text-[15px]', target && 'hover:underline')
  const titleContent = (
    <>
      {title}
      {unread && <span className="sr-only"> (non lue)</span>}
    </>
  )

  return (
    <li className={cx('relative flex gap-3', compact ? 'px-4 py-3' : 'px-5.5 py-4', unread && 'bg-info-soft/40')}>
      <span className="relative self-start">
        <NotificationIcon data={notification.data} compact={compact} />
        {unread && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-primary" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {target?.to ? (
            <Link to={target.to} onClick={handleOpen} className={titleClass}>
              {titleContent}
            </Link>
          ) : target?.href ? (
            <a href={target.href} target="_blank" rel="noopener noreferrer" onClick={handleOpen} className={titleClass}>
              {titleContent}
              <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
            </a>
          ) : (
            <p className={titleClass}>{titleContent}</p>
          )}
          {priority === 'high' && <Badge tone="danger">Prioritaire</Badge>}
        </div>
        <p className={cx('mt-0.5 text-sm text-muted', compact && 'line-clamp-2')}>{message}</p>
        <p className="mt-1 text-xs text-muted">
          {formatRelative(notification.created_at)}
          {!compact && ` · ${categoryLabel(category, user)}`}
        </p>
      </div>
      {unread && !target && (
        <Button
          variant="secondary"
          className={cx('shrink-0 self-start', compact ? 'px-2.5 text-xs' : 'text-sm')}
          onClick={() => onRead(notification)}
          aria-label={`Marquer comme lue : ${title}`}
        >
          <Check className="size-4" aria-hidden="true" /> {!compact && 'Marquer comme lue'}
        </Button>
      )}
    </li>
  )
}
