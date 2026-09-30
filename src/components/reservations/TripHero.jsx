import { Bus, CalendarDays } from 'lucide-react'
import { formatDate, formatTime } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { isTerminal, shortAddress, todayApiDate } from '../../lib/reservations'
import { trackSpotlight } from '../../lib/spotlight'
import { StatusBadge } from '../ui/StatusBadge'

// En-tête du détail d'un déplacement, façon billet : talon daté, motif, statut, compte à rebours,
// trajet départ → destination ; les actions (children) se placent à droite.
export function TripHero({ reservation, children }) {
  const upcoming = !isTerminal(reservation) && reservation.trip_date >= todayApiDate()
  const day = formatDate(reservation.trip_date, { weekday: 'short' }).replace('.', '')
  const month = formatDate(reservation.trip_date, { month: 'short' }).replace('.', '')

  return (
    <section
      aria-labelledby="trip-title"
      onPointerMove={trackSpotlight}
      className="spotlight spotlight-warm flex flex-col overflow-hidden rounded-panel bg-hero text-white shadow-soft sm:flex-row"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="relative grid shrink-0 place-content-center bg-accent px-6 py-4 text-center leading-none text-on-accent sm:w-32"
      >
        <span className="text-sm font-bold uppercase">{day}</span>
        <span className="mt-1 text-5xl font-extrabold">{Number(reservation.trip_date.slice(8, 10))}</span>
        <span className="mt-1 text-sm font-bold uppercase">{month}</span>
      </div>

      <div className="grid min-w-0 flex-1 items-center gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Déplacement</p>
          <h1 id="trip-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight sm:text-[30px]">
            {reservation.trip_purpose}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={reservation.status} label={reservation.status_label} />
            <span className="inline-flex items-center gap-1.5 text-nav-ink">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(reservation.trip_date)}
              {upcoming && ` · ${countdown(reservation.trip_date)}`}
            </span>
          </div>

          <div className="mt-5 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tabular-nums">{formatTime(reservation.departure_time)}</span>
              <span aria-hidden="true" className="relative h-0 flex-1 border-t-2 border-dashed border-white/40">
                <span className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full bg-white" />
                <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-accent text-on-accent">
                  <Bus className="size-4.5" />
                </span>
                <span className="absolute top-1/2 -right-1 size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-(--hero-to)" />
              </span>
              <span className="text-xl font-bold tabular-nums">{formatTime(reservation.return_time)}</span>
            </div>
            <div className="mt-1.5 flex justify-between gap-4 text-sm text-nav-ink">
              <span className="truncate">
                <span className="sr-only">Départ de </span>
                {shortAddress(reservation.pickup_location)}
              </span>
              <span className="truncate text-right">
                <span className="sr-only">, destination </span>
                {shortAddress(reservation.destination_location)}
              </span>
            </div>
            <p className="sr-only">
              Départ à {formatTime(reservation.departure_time)}, départ du retour à {formatTime(reservation.return_time)}.
            </p>
          </div>
        </div>

        {children && <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">{children}</div>}
      </div>
    </section>
  )
}
