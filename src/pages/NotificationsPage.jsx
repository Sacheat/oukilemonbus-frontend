import { BellOff, CheckCheck, Search, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsReadByFilter,
} from '../api/notifications'
import { useAuth } from '../auth/useAuth'
import { NotificationItem } from '../components/notifications/NotificationItem'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Input } from '../components/ui/Field'
import { FilterChips } from '../components/ui/FilterChips'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Skeleton } from '../components/ui/Skeleton'
import { useNotificationsList, useNotificationsSummary } from '../hooks/useNotificationsList'
import { cx } from '../lib/cx'
import { getErrorMessage } from '../lib/errors'
import {
  categoryLabel,
  groupByDay,
  notificationCategories,
  notificationFilterParams,
  readNotificationsSearch,
} from '../lib/notifications'
import { useNotifications } from '../notifications/useNotifications'

const SEARCH_DELAY_MS = 300

// Toutes mes notifications (page commune à tous les rôles) : recherche, filtres en pastilles (état : toutes, non
// lues, urgentes ; catégorie) avec les nombres de GET /notifications/summary, groupées par jour. « Tout marquer comme
// lu » mis en avant tant qu'il en reste ; avec un filtre, seules les notifications filtrées sont marquées
// (PATCH /notifications/read-by-filter, mêmes paramètres que la liste).
export function NotificationsPage() {
  const { user } = useAuth()
  const { unreadCount, refreshCount } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readNotificationsSearch(searchParams)
  const { state, category, search, page } = filters
  const [searchInput, setSearchInput] = useState(search)
  const searchTimer = useRef(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Clés texte : la liste et les résumés ne sont relus que si leurs paramètres changent
  const listKey = JSON.stringify({ ...notificationFilterParams(filters), page })
  // Nombres des catégories : tous les filtres sauf la catégorie ; nombres des états : tous sauf l'état
  const categoryCountKey = JSON.stringify(notificationFilterParams(filters, ['category']))
  const stateCountKey = JSON.stringify(notificationFilterParams(filters, ['state']))

  const notifications = useNotificationsList(listKey)
  const categoryCounts = useNotificationsSummary(categoryCountKey)
  const stateCounts = useNotificationsSummary(stateCountKey)

  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  function setFilter(name, value) {
    updateSearch({ [name]: value })
  }

  // Recherche : l'URL suit la saisie 300 ms après la dernière frappe ; retour à la première page
  function changeSearch(value) {
    setSearchInput(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => updateSearch({ q: value.trim() }), SEARCH_DELAY_MS)
  }
  useEffect(() => () => clearTimeout(searchTimer.current), [])

  function reloadAll() {
    notifications.reload()
    categoryCounts.reload()
    stateCounts.reload()
    refreshCount()
  }

  async function handleRead(notification) {
    setActionError(null)
    try {
      await markNotificationRead(notification.id)
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
    reloadAll()
  }

  // Sans filtre : toutes ; avec un filtre : seulement les notifications filtrées (toutes pages confondues)
  const filterParams = notificationFilterParams(filters)
  const isFiltered = Object.keys(filterParams).length > 0
  async function handleReadAll() {
    setMarkingAll(true)
    setActionError(null)
    try {
      if (isFiltered) await markNotificationsReadByFilter(filterParams)
      else await markAllNotificationsRead()
    } catch (error) {
      setActionError(getErrorMessage(error))
    }
    setMarkingAll(false)
    reloadAll()
  }

  const byCategory = categoryCounts.data?.by_category
  const categoryCount = (value) => (byCategory ? (byCategory.find((item) => item.category === value)?.total ?? 0) : null)
  const states = stateCounts.data
  const urgentCount = states ? (states.by_priority.find((item) => item.priority === 'high')?.total ?? 0) : null
  const stateChips = [
    { value: null, label: 'Toutes', count: states ? states.total : undefined },
    { value: 'non-lues', label: 'Non lues', count: states ? states.unread : unreadCount },
    { value: 'urgentes', label: 'Urgentes', count: urgentCount },
  ]
  const categoryChips = [
    { value: null, label: 'Toutes les catégories', count: categoryCounts.data ? categoryCounts.data.total : undefined },
    ...notificationCategories(user).map((value) => ({ value, label: categoryLabel(value, user), count: categoryCount(value) })),
  ]

  // Non lues parmi les notifications filtrées (le résumé des catégories applique déjà les autres filtres)
  const filteredUnread = !isFiltered
    ? unreadCount
    : !categoryCounts.data
      ? 0
      : category
        ? (byCategory.find((item) => item.category === category)?.unread ?? 0)
        : categoryCounts.data.unread
  const readAllLabel = !isFiltered
    ? `Tout marquer comme lu (${unreadCount})`
    : filteredUnread > 1
      ? `Marquer ces ${filteredUnread} comme lues`
      : 'Marquer comme lue'

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Mon compte"
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}.` : 'Tout est lu.'}
        actions={
          <>
            {filteredUnread > 0 && (
              <Button onClick={handleReadAll} loading={markingAll}>
                <CheckCheck className="size-4" aria-hidden="true" /> {readAllLabel}
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
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Rechercher une notification"
            placeholder="Titre ou message"
            value={searchInput}
            onChange={(event) => changeSearch(event.target.value)}
            className="py-2 pl-9 text-sm"
          />
        </div>
        <FilterChips label="État" chips={stateChips} value={state} onChange={(value) => setFilter('etat', value)} />
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
            {isFiltered ? 'Aucune notification ne correspond à ces filtres.' : 'Les changements sur vos demandes apparaîtront ici.'}
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
