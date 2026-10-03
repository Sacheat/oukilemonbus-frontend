import { CalendarDays, Clock, Navigation } from 'lucide-react'
import { Link } from 'react-router'
import { formatTime } from '../../lib/dates'
import { daySummary, minutesUntil, tripsNow } from '../../lib/dashboard'
import { greeting } from '../../lib/home'
import { trackSpotlight } from '../../lib/spotlight'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { BusRoute } from '../home/BusRoute'

const outlineLink =
  'inline-flex min-h-11 items-center gap-2 rounded-control border border-white/30 px-4 font-bold text-white backdrop-blur-sm transition hover:bg-white/10'

// Bannière du tableau de bord : salutation, la journée en une phrase, heure de mise à jour, actions rapides
// et encart « Maintenant » (trajets confirmés en route, prochain départ). `data` undefined : chargement.
// `nowTime` : "HH:mm" à Bruxelles ; `actions` : liens rapides déjà filtrés par permission.
export function DashboardHero({ firstName, data, nowTime, updatedAt, actions }) {
  const { onTheRoad, next } = data ? tripsNow(data.today.trips, nowTime) : { onTheRoad: [], next: null }

  return (
    <section
      aria-labelledby="dashboard-title"
      onPointerMove={trackSpotlight}
      className="spotlight spotlight-warm overflow-hidden rounded-panel bg-hero px-6 py-7 text-white shadow-soft sm:px-9 sm:py-8"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Espace gestion</p>
          <h1 id="dashboard-title" className="mt-2 text-[30px] leading-tight font-bold tracking-tight sm:text-[36px]">
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
            <div className="mt-6 flex flex-wrap gap-2.5">
              {actions.map((action, index) =>
                index === 0 ? (
                  <Button key={action.to} variant="accent" to={action.to} className="shadow-lg shadow-black/20">
                    <action.icon className="size-4" aria-hidden="true" /> {action.label}
                  </Button>
                ) : (
                  <Link key={action.to} to={action.to} className={outlineLink}>
                    <action.icon className="size-4" aria-hidden="true" /> {action.label}
                  </Link>
                ),
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-card border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Maintenant</p>
          {onTheRoad.length > 0 && <BusRoute />}
          {!data ? (
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
                        <span key={trip.id} className="block text-nav-ink">
                          {trip.organization?.name}, retour prévu à {formatTime(trip.return_time)}
                        </span>
                      ))}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="text-sm">
                  {next ? (
                    <>
                      <strong>Prochain départ à {formatTime(next.departure_time)}</strong>{' '}
                      <span className="text-accent">({minutesUntil(next.departure_time, nowTime)})</span>
                      <span className="block text-nav-ink">
                        {next.organization?.name}
                        {next.vehicle && ` · ${next.vehicle.licence_plate}`}
                      </span>
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
