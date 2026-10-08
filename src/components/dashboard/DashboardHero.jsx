import { AlarmClock, CalendarDays, Clock, Navigation } from 'lucide-react'
import { Link } from 'react-router'
import { formatTime } from '../../lib/dates'
import { daySummary, minutesUntil, planningDayLink, tripsNow } from '../../lib/dashboard'
import { greeting } from '../../lib/home'
import { trackSpotlight } from '../../lib/spotlight'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { BusRoute } from '../home/BusRoute'

const outlineLink =
  'inline-flex min-h-11 items-center gap-2 rounded-control border border-white/30 px-4 font-bold text-white backdrop-blur-sm transition hover:bg-white/10'

// Nombre affiché sur une action rapide (« Traiter les réservations » : à traiter, comme le menu)
function ActionCount({ count }) {
  if (!count) return null
  return (
    <span className="rounded-full bg-nav px-2 py-0.5 text-xs font-bold text-white tabular-nums">
      <span className="sr-only">, </span>
      {count > 99 ? '99+' : count}
      <span className="sr-only"> à traiter</span>
    </span>
  )
}

// Une ligne de l'encart « Maintenant » : ouvre le trajet dans le Planning si `linkable`
function TripLine({ trip, linkable, children }) {
  if (!linkable) return <span className="block text-nav-ink">{children}</span>
  return (
    <Link
      to={planningDayLink(trip.trip_date, trip.id)}
      className="block text-nav-ink underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
    >
      {children}
    </Link>
  )
}

// Bannière du tableau de bord : salutation, la journée en une phrase, heure de mise à jour, actions rapides
// et encart « Maintenant » (bus en route, départs en retard, prochain départ ; trajets confirmés seulement).
// `data` undefined : chargement. `nowTime` : "HH:mm" à Bruxelles ; `actions` : liens rapides déjà filtrés par
// permission ; `queueCount` : nombre à traiter pour l'action `count: 'queue'`.
// `progress` : avancement réel par trajet (étapes du chauffeur), undefined pendant son chargement, null s'il n'a pas
// pu être lu (l'encart se repère alors sur l'horaire et le dit). `linkable` : chaque trajet de l'encart ouvre le
// Planning (permission reservations.view).
export function DashboardHero({ firstName, data, nowTime, updatedAt, actions, queueCount, progress, linkable }) {
  const ready = data && progress !== undefined
  const { onTheRoad, late, next, fromSchedule } = ready
    ? tripsNow(data.today.trips, nowTime, progress)
    : { onTheRoad: [], late: [], next: null, fromSchedule: false }

  return (
    <section
      aria-labelledby="dashboard-title"
      onPointerMove={trackSpotlight}
      className="spotlight spotlight-warm overflow-hidden rounded-panel bg-hero px-5 py-6 text-white shadow-soft sm:px-9 sm:py-8"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div className="grid items-center gap-5 sm:gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Espace gestion</p>
          <h1 id="dashboard-title" className="mt-2 text-[26px] leading-tight font-bold tracking-tight sm:text-[36px]">
            {greeting()} {firstName}
          </h1>
          {data ? (
            <p className="mt-2 max-w-xl text-nav-ink">{daySummary(data)}</p>
          ) : (
            <Skeleton className="mt-3 h-4 w-72 max-w-full opacity-40" />
          )}
          {updatedAt && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-nav-ink/80">
              <Clock className="size-3.5" aria-hidden="true" />
              Mis à jour à {updatedAt}, actualisé chaque minute
            </p>
          )}
          {actions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6">
              {actions.map((action, index) =>
                index === 0 ? (
                  <Button key={action.to} variant="accent" to={action.to} className="shadow-lg shadow-black/20">
                    <action.icon className="size-4" aria-hidden="true" /> {action.label}
                    {action.count === 'queue' && <ActionCount count={queueCount} />}
                  </Button>
                ) : (
                  <Link key={action.to} to={action.to} className={outlineLink}>
                    <action.icon className="size-4" aria-hidden="true" /> {action.label}
                    {action.count === 'queue' && <ActionCount count={queueCount} />}
                  </Link>
                ),
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-card border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
          <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">
            Maintenant
            {fromSchedule && <span className="font-semibold tracking-normal text-nav-ink normal-case">d’après l’horaire</span>}
          </p>
          {onTheRoad.length > 0 && (
            <div className="hidden sm:block">
              <BusRoute />
            </div>
          )}
          {!ready ? (
            <Skeleton className="h-10 w-full opacity-40" />
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <Navigation className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="text-sm">
                  {onTheRoad.length === 0 ? (
                    <span className="text-nav-ink">Aucun bus en route.</span>
                  ) : (
                    <>
                      <strong>{onTheRoad.length} bus en route</strong>
                      {onTheRoad.map((trip) => (
                        <TripLine key={trip.id} trip={trip} linkable={linkable}>
                          {trip.organization?.name}, retour prévu à {formatTime(trip.return_time)}
                        </TripLine>
                      ))}
                    </>
                  )}
                </p>
              </div>
              {late.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <AlarmClock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <p className="text-sm">
                    <strong>
                      {late.length > 1 ? `${late.length} bus pas encore partis` : 'Un bus pas encore parti'}
                    </strong>
                    {late.map((trip) => (
                      <TripLine key={trip.id} trip={trip} linkable={linkable}>
                        {trip.organization?.name}, départ prévu à {formatTime(trip.departure_time)}
                      </TripLine>
                    ))}
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="text-sm">
                  {next ? (
                    <>
                      <strong>Prochain départ à {formatTime(next.departure_time)}</strong>{' '}
                      <span className="text-accent">({minutesUntil(next.departure_time, nowTime)})</span>
                      <TripLine trip={next} linkable={linkable}>
                        {next.organization?.name}
                        {next.vehicle && ` · ${next.vehicle.licence_plate}`}
                      </TripLine>
                    </>
                  ) : (
                    <span className="text-nav-ink">Plus aucun départ confirmé aujourd’hui.</span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
