import { Link } from 'react-router'
import { getDashboard } from '../../api/dashboard'
import { useAuth } from '../../auth/useAuth'
import { useQueueCount } from '../../backoffice/useQueueCount'
import { OpenAlertsBanner } from '../../components/alerts/OpenAlertsBanner'
import { DashboardHero } from '../../components/dashboard/DashboardHero'
import { DayTimeline } from '../../components/dashboard/DayTimeline'
import { PanelSkeleton } from '../../components/dashboard/PanelSkeleton'
import { TodayTrips } from '../../components/dashboard/TodayTrips'
import { ToProcessTiles } from '../../components/dashboard/ToProcessTiles'
import { WatchList } from '../../components/dashboard/WatchList'
import { WeekChart } from '../../components/dashboard/WeekChart'
import { PlanningExportButton } from '../../components/planning/PlanningExportButton'
import { ErrorState } from '../../components/ui/ErrorState'
import { Panel } from '../../components/ui/Panel'
import { useApi } from '../../hooks/useApi'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useNow } from '../../hooks/useNow'
import { useTripProgress } from '../../hooks/useTripProgress'
import { countLabel, QUICK_ACTIONS, watchItems } from '../../lib/dashboard'
import { brusselsNow } from '../../lib/dates'
import { ACTIVE_STATUSES } from '../../lib/planning'

// Indicateurs avec l'heure de réception (« Mis à jour à … » dans le bandeau)
function fetchDashboard(signal) {
  return getDashboard({ signal }).then((data) => ({ ...data, receivedAt: brusselsNow().slice(11) }))
}

// Tableau de bord de l'espace gestion (agent et admin), du plus urgent au plus lointain : bandeau (journée en une
// phrase, actions rapides dont « Traiter les réservations », encart « Maintenant »), demandes d'aide en cours,
// « À faire » (seulement ce sur quoi l'agent peut agir), « À surveiller » (passagers à confirmer par le demandeur,
// alertes flotte), frise et liste des trajets du jour, 7 prochains jours. Chiffres lus dans GET /dashboard ;
// avancement réel des trajets du jour dans GET /trip-progress (repli sur l'horaire s'il échoue). Rechargés toutes
// les 60 s et au retour sur l'onglet, sans effacer l'affichage. Chaque lien n'est actif qu'avec la permission de la
// page visée.
export function DashboardPage() {
  const { user, can } = useAuth()
  const { pendingCount } = useQueueCount()
  const dashboard = useApi(fetchDashboard)
  useAutoRefresh(dashboard.reload)
  const nowTime = useNow().slice(11)
  const data = dashboard.data
  const tripProgress = useTripProgress(data ? data.today.trips.map((trip) => trip.id).join(',') : '')
  // undefined : en cours de chargement ; null : indisponible (l'encart « Maintenant » se repère sur l'horaire)
  const progress = tripProgress.data ?? (tripProgress.error ? null : undefined)
  const canSeePlanning = can('reservations.view')
  const watchLinks = {
    passengers: can('reservations.approve') ? '/gestion/reservations?file=passagers' : null,
    unavailabilities: can('unavailabilities.create') ? '/gestion/indisponibilites' : null,
    vehicles: can('vehicles.update') ? '/gestion/vehicules' : null,
    drivers: can('drivers.update') ? '/gestion/chauffeurs' : null,
  }
  const tripsCount = data?.today.trips_count
  // Export Excel des 7 jours affichés, mêmes paramètres que la page Planning
  const weekExportParams = data && {
    start_date: data.week.start_date,
    end_date: data.week.end_date,
    statuses: ACTIVE_STATUSES,
  }

  return (
    <div className="grid gap-7">
      <DashboardHero
        firstName={user.first_name}
        data={data}
        nowTime={nowTime}
        updatedAt={data?.receivedAt}
        actions={QUICK_ACTIONS.filter((action) => can(action.permission))}
        queueCount={pendingCount}
        progress={data ? progress : undefined}
        linkable={canSeePlanning}
      />

      {can('driver-alerts.manage') && <OpenAlertsBanner />}

      {/* Erreur au premier chargement seulement : après, on garde les derniers chiffres reçus */}
      {dashboard.error && !data && <ErrorState error={dashboard.error} onRetry={dashboard.reload} />}

      <section aria-labelledby="to-process-title">
        <h2 id="to-process-title" className="mb-3 text-base font-bold">
          À faire
        </h2>
        <ToProcessTiles toProcess={data?.to_process} can={can} />
      </section>

      {data && <WatchList items={watchItems(data, watchLinks)} />}

      <div className="grid gap-7 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <Panel
            title={tripsCount == null ? 'Aujourd’hui' : `Aujourd’hui · ${tripsCount} ${countLabel(tripsCount, ['trajet', 'trajets'])}`}
            action={
              canSeePlanning && (
                <Link to="/gestion/planning" className="text-sm font-semibold text-link hover:underline">
                  Ouvrir le planning
                </Link>
              )
            }
          >
            {data ? (
              <>
                {data.today.trips.length > 0 && (
                  <div className="border-b border-line">
                    <DayTimeline
                      trips={data.today.trips}
                      nowTime={nowTime}
                      linkable={canSeePlanning}
                      progress={progress ?? undefined}
                    />
                  </div>
                )}
                <TodayTrips
                  trips={data.today.trips}
                  linkable={canSeePlanning}
                  progress={progress ?? undefined}
                  nowTime={nowTime}
                />
              </>
            ) : (
              !dashboard.error && <PanelSkeleton rows={3} />
            )}
          </Panel>
        </div>

        <div className="min-w-0 self-start lg:col-span-2">
          <Panel
            title="7 prochains jours"
            action={
              canSeePlanning && weekExportParams && <PlanningExportButton exportParams={weekExportParams} compact />
            }
          >
            {data ? (
              <WeekChart days={data.week.trips_by_day} linkable={canSeePlanning} />
            ) : (
              !dashboard.error && <PanelSkeleton rows={2} />
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
