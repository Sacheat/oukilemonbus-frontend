import { AlertTriangle, ArrowRight, BellRing, CalendarCheck, CalendarDays, Hourglass } from 'lucide-react'
import { useCallback } from 'react'
import { Link } from 'react-router'
import { getNotifications } from '../../api/notifications'
import { getOrgRegistrationRequests, getUserOrgRequests } from '../../api/organizations'
import { getNextTrip, getReservations } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { HomeHero } from '../../components/home/HomeHero'
import { HomePanel } from '../../components/home/HomePanel'
import { RecentActivity } from '../../components/home/RecentActivity'
import { StatTile } from '../../components/home/StatTile'
import { TodoList } from '../../components/home/TodoList'
import { TripTicket } from '../../components/home/TripTicket'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { useApi } from '../../hooks/useApi'
import { passengersWindowEnd, todoItems } from '../../lib/home'
import { myRequests } from '../../lib/organizations'
import { recurrenceOrganizations } from '../../lib/recurrences'
import { todayApiDate } from '../../lib/reservations'
import { useNotifications } from '../../notifications/useNotifications'

// Comptages et éléments « À faire » de l'accueil (une vague d'appels en parallèle)
async function fetchDashboard(userId, signal) {
  const today = todayApiDate()
  const upcoming = (params) => getReservations({ date_from: today, sort: 'asc', ...params }, { signal })
  const [confirmed, pending, conflicts, soon, joinRequests, creationRequests] = await Promise.all([
    upcoming({ status: 'confirme' }),
    upcoming({ status: 'en_attente' }),
    upcoming({ status: 'en_conflit' }),
    upcoming({ date_to: passengersWindowEnd() }),
    getUserOrgRequests({}, { signal }),
    getOrgRegistrationRequests({}, { signal }),
  ])
  return {
    counts: { confirmed: confirmed.meta.total, pending: pending.meta.total, conflicts: conflicts.meta.total },
    conflicts: conflicts.data,
    soon: soon.data,
    pendingRequests: myRequests(userId, joinRequests.data, creationRequests.data).filter(
      (item) => item.request.status === 'en_attente',
    ),
  }
}

function fetchNextTrip(signal) {
  return getNextTrip({ signal })
}

function fetchActivity(signal) {
  return getNotifications({ per_page: 3 }, { signal }).then((page) => page.data)
}

// Accueil de l'espace demandeur : bannière, chiffres clés, prochain trajet, à faire et activité
export function UserHomePage() {
  const { user, can } = useAuth()
  const { unreadCount } = useNotifications()
  const hasOrganization = user.organizations?.length > 0
  const canBook = can('reservations.create') && hasOrganization
  const canRecur = canBook && recurrenceOrganizations(user).length > 0

  const fetchStats = useCallback((signal) => fetchDashboard(user.id, signal), [user.id])
  const dashboard = useApi(fetchStats)
  const nextTrip = useApi(fetchNextTrip)
  const activity = useApi(fetchActivity)
  const counts = dashboard.data?.counts

  const todo = dashboard.data
    ? todoItems({
        user,
        conflicts: dashboard.data.conflicts,
        upcoming: dashboard.data.soon,
        pendingRequests: dashboard.data.pendingRequests,
      })
    : []

  return (
    <div className="grid gap-7">
      <HomeHero firstName={user.first_name} canBook={canBook} canRecur={canRecur} />

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          En un coup d’œil
        </h2>
        {dashboard.error ? (
          <ErrorState error={dashboard.error} onRetry={dashboard.reload} />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatTile
              to="/espace/deplacements?statut=confirme"
              icon={CalendarCheck}
              value={counts?.confirmed ?? null}
              label={counts?.confirmed === 1 ? 'trajet confirmé à venir' : 'trajets confirmés à venir'}
            />
            <StatTile
              to="/espace/deplacements?statut=en_attente"
              icon={Hourglass}
              tone="warning"
              value={counts?.pending ?? null}
              label={counts?.pending === 1 ? 'demande en attente' : 'demandes en attente'}
            />
            <StatTile
              to="/espace/deplacements?statut=en_conflit"
              icon={AlertTriangle}
              tone="conflict"
              value={counts?.conflicts ?? null}
              label={counts?.conflicts === 1 ? 'trajet en conflit' : 'trajets en conflit'}
            />
            <StatTile
              to="/notifications?etat=non-lues"
              icon={BellRing}
              tone="info"
              value={unreadCount}
              label={unreadCount === 1 ? 'notification non lue' : 'notifications non lues'}
            />
          </div>
        )}
      </section>

      <section aria-label="Votre prochain trajet">
        {nextTrip.error ? (
          <ErrorState error={nextTrip.error} onRetry={nextTrip.reload} />
        ) : nextTrip.loading && !nextTrip.data ? (
          <Loader />
        ) : nextTrip.data ? (
          <TripTicket reservation={nextTrip.data} />
        ) : (
          <div className="flex items-center gap-3 rounded-card border border-dashed border-line-strong p-5 text-sm text-muted">
            <CalendarDays className="size-5 shrink-0" aria-hidden="true" />
            Aucun trajet prévu pour le moment.
          </div>
        )}
      </section>

      <div className="grid gap-7 lg:grid-cols-2">
        <HomePanel title="À faire">
          {dashboard.data ? <TodoList items={todo} /> : dashboard.error ? null : <Loader />}
        </HomePanel>

        <HomePanel
          title="Activité récente"
          action={
            <Link to="/notifications" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-link hover:underline">
              Tout voir <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        >
          {activity.error ? (
            <ErrorState error={activity.error} onRetry={activity.reload} className="m-4" />
          ) : activity.data ? (
            <RecentActivity notifications={activity.data} onChanged={activity.reload} />
          ) : (
            <Loader />
          )}
        </HomePanel>
      </div>
    </div>
  )
}
