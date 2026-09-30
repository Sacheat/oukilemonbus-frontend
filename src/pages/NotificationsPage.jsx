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
import { Select } from '../components/ui/Field'
import { Loader } from '../components/ui/Loader'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { useApi } from '../hooks/useApi'
import { cx } from '../lib/cx'
import { getErrorMessage } from '../lib/errors'
import { categoryLabel, notificationCategories } from '../lib/notifications'
import { useNotifications } from '../notifications/useNotifications'

const STATES = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'non-lues', label: 'Non lues' },
]

// Paramètres de l'API selon les filtres de l'URL (?etat=non-lues&categorie=…&page=…)
function toApiParams(searchParams) {
  const params = { page: searchParams.get('page') ?? 1 }
  if (searchParams.get('etat') === 'non-lues') params.unread = 1
  if (searchParams.get('categorie')) params.category = searchParams.get('categorie')
  return params
}

// Toutes mes notifications (page commune à tous les rôles)
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

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Mon compte"
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}.` : 'Tout est lu.'}
        actions={
          <>
            <Button variant="secondary" onClick={handleReadAll} loading={markingAll} disabled={unreadCount === 0}>
              <CheckCheck className="size-4" aria-hidden="true" /> Tout marquer comme lu
            </Button>
            <Button variant="secondary" to="/compte#notifications">
              <Settings className="size-4" aria-hidden="true" /> Réglages
            </Button>
          </>
        }
        className="pb-5"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="État" className="flex rounded-control border border-line-strong bg-surface p-1">
          {STATES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={state === option.value}
              onClick={() => setFilter('etat', option.value === 'toutes' ? null : option.value)}
              className={cx(
                'min-h-9 rounded-md px-3 text-sm font-semibold',
                state === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold text-muted">
          Catégorie
          <Select
            value={searchParams.get('categorie') ?? ''}
            onChange={(event) => setFilter('categorie', event.target.value)}
            className="mt-1 min-h-11 py-2 text-sm"
          >
            <option value="">Toutes les catégories</option>
            {notificationCategories(user).map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category, user)}
              </option>
            ))}
          </Select>
        </label>
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
          <Loader />
        ) : notifications.data.data.length === 0 ? (
          <EmptyState icon={BellOff} title="Aucune notification">
            {query ? 'Aucune notification ne correspond à ces filtres.' : 'Les changements sur vos demandes apparaîtront ici.'}
          </EmptyState>
        ) : (
          <>
            <ul
              className={cx(
                'divide-y divide-line overflow-hidden rounded-card border border-line bg-surface',
                notifications.loading && 'opacity-60',
              )}
            >
              {notifications.data.data.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onRead={handleRead} />
              ))}
            </ul>
            <div className="mt-6">
              <Pagination meta={notifications.data.meta} onPageChange={(page) => setFilter('page', String(page))} />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
