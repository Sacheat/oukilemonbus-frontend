import { BellOff, CheckCheck, Settings } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications'
import { useAuth } from '../auth/useAuth'
import { NotificationItem } from '../components/notifications/NotificationItem'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChips } from '../components/ui/FilterChips'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Skeleton } from '../components/ui/Skeleton'
import { useApi } from '../hooks/useApi'
import { cx } from '../lib/cx'
import { getErrorMessage } from '../lib/errors'
import { categoryLabel, groupByDay, notificationCategories } from '../lib/notifications'
import { useNotifications } from '../notifications/useNotifications'

// Paramètres de l'API selon les filtres de l'URL (?etat=non-lues&categorie=…&page=…)
function toApiParams(searchParams) {
  const params = { page: searchParams.get('page') ?? 1 }
  if (searchParams.get('etat') === 'non-lues') params.unread = 1
  if (searchParams.get('categorie')) params.category = searchParams.get('categorie')
  return params
}

// Toutes mes notifications (page commune à tous les rôles) : filtres en pastilles (état, catégorie),
// groupées par jour, « Tout marquer comme lu » mis en avant tant qu'il en reste
export function NotificationsPage() {
  const { user } = useAuth()
  const { unreadCount, refreshCount } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = searchParams.get('etat') ?? 'toutes'
  const query = searchParams.toString()
  const [markingAll, setMarkingAll] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetchNotifications = useCallback(
    (signal) => getNotifications(toApiParams(new URLSearchParams(query)), { signal }),
    [query],
  )
  const notifications = useApi(fetchNotifications)

  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setSearchParams(next)
  }

  async function handleRead(notification) {
    setActionError(null)
    try {
      await markNotificationRead(notification.id)
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
    notifications.reload()
    refreshCount()
  }

  async function handleReadAll() {
    setMarkingAll(true)
    setActionError(null)
    try {
      await markAllNotificationsRead()
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
    setMarkingAll(false)
    notifications.reload()
    refreshCount()
  }

  const category = searchParams.get('categorie')
  const stateChips = [
    { value: null, label: 'Toutes' },
    { value: 'non-lues', label: 'Non lues', count: unreadCount },
  ]
  const categoryChips = [
    { value: null, label: 'Toutes les catégories' },
    ...notificationCategories(user).map((value) => ({ value, label: categoryLabel(value, user) })),
  ]

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Mon compte"
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}.` : 'Tout est lu.'}
        actions={
          <>
            {unreadCount > 0 && (
              <Button onClick={handleReadAll} loading={markingAll}>
                <CheckCheck className="size-4" aria-hidden="true" /> Tout marquer comme lu ({unreadCount})
              </Button>
            )}
            <Button variant="secondary" to="/compte#notifications">
              <Settings className="size-4" aria-hidden="true" /> Réglages
            </Button>
          </>
        }
        className="pb-5"
      />

      <div className="grid gap-3">
        <FilterChips
          label="État"
          chips={stateChips}
          value={state === 'non-lues' ? 'non-lues' : null}
          onChange={(value) => setFilter('etat', value)}
        />
        <FilterChips label="Catégorie" chips={categoryChips} value={category} onChange={(value) => setFilter('categorie', value)} />
      </div>

      {actionError && (
        <Alert tone="danger" className="mt-4">
          {actionError}
        </Alert>
      )}

      <section aria-label="Liste des notifications" aria-busy={notifications.loading} className="mt-6">
        {notifications.error ? (
          <ErrorState error={notifications.error} onRetry={notifications.reload} />
        ) : !notifications.data ? (
          <div role="status" className="grid gap-3">
            <span className="sr-only">Chargement des notifications…</span>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-72 rounded-card" />
          </div>
        ) : notifications.data.data.length === 0 ? (
          <EmptyState icon={BellOff} title="Aucune notification">
            {query ? 'Aucune notification ne correspond à ces filtres.' : 'Les changements sur vos demandes apparaîtront ici.'}
          </EmptyState>
        ) : (
          <>
            <div className={cx('grid gap-6', notifications.loading && 'opacity-60')}>
              {groupByDay(notifications.data.data).map((group) => (
                <section key={group.key} aria-labelledby={`jour-${group.key}`}>
                  <h2 id={`jour-${group.key}`} className="mb-2.5 text-sm font-extrabold tracking-[.1em] text-muted uppercase">
                    {group.label}
                  </h2>
                  <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
                    {group.items.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} onRead={handleRead} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="mt-6">
              <Pagination meta={notifications.data.meta} onPageChange={(page) => setFilter('page', String(page))} />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
