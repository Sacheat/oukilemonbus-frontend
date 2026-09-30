import { Bell } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notifications'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { useNotifications } from '../../notifications/useNotifications'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { NotificationItem } from './NotificationItem'

// Cloche de l'en-tête : badge des non lues et panneau des 5 dernières notifications.
// Le panneau se ferme avec Échap, un clic ailleurs ou un changement de page.
export function NotificationBell({ className }) {
  const { unreadCount, refreshCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const location = useLocation()

  // Fermeture au changement de page (ex. clic sur une notification)
  const [pathname, setPathname] = useState(location.pathname)
  if (pathname !== location.pathname) {
    setPathname(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Notifications'

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title="Notifications"
        className="relative grid size-11 place-items-center rounded-control hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] leading-none font-bold text-on-danger"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel id={panelId} unreadCount={unreadCount} refreshCount={refreshCount} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

function fetchLatest(signal) {
  return getNotifications({ per_page: 5 }, { signal })
}

function NotificationPanel({ id, unreadCount, refreshCount, onClose }) {
  const latest = useApi(fetchLatest)
  const [markingAll, setMarkingAll] = useState(false)

  async function handleRead(notification) {
    await markNotificationRead(notification.id).catch(() => {})
    latest.reload()
    refreshCount()
  }

  async function handleReadAll() {
    setMarkingAll(true)
    await markAllNotificationsRead().catch(() => {})
    setMarkingAll(false)
    latest.reload()
    refreshCount()
  }

  return (
    <section
      id={id}
      aria-label="Dernières notifications"
      className="absolute right-0 z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-line bg-surface text-ink shadow-lg"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <h2 className="text-sm font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleReadAll}
            disabled={markingAll}
            className="min-h-11 text-sm font-bold text-link hover:underline disabled:opacity-60"
          >
            Tout marquer comme lu
          </button>
        )}
      </header>
      <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
        {latest.error ? (
          <ErrorState error={latest.error} onRetry={latest.reload} className="m-4" />
        ) : !latest.data ? (
          <Loader />
        ) : latest.data.data.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Aucune notification pour le moment.</p>
        ) : (
          <ul className="divide-y divide-line">
            {latest.data.data.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onRead={handleRead} onNavigate={onClose} compact />
            ))}
          </ul>
        )}
      </div>
      <Link
        to="/notifications"
        onClick={onClose}
        className="flex min-h-11 items-center justify-center border-t border-line text-sm font-bold text-link hover:underline"
      >
        Voir toutes les notifications
      </Link>
    </section>
  )
}
