import { CalendarDays } from 'lucide-react'
import { formatDate, formatTime } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { estimatedArrivals, isTerminal, shortAddress, todayApiDate } from '../../lib/reservations'
import { trackSpotlight } from '../../lib/spotlight'
import { StatusBadge } from '../ui/StatusBadge'
import { TripLeg } from './TripLeg'

// En-tête du détail d'un déplacement, façon billet : talon daté, motif, statut, compte à rebours,
// trajets aller et retour avec les heures d'arrivée estimées ; les actions (children) se placent à droite.
// Aperçu dans l'assistant : `eyebrow`, `titleAs` (niveau du titre) et `showStatus={false}` (pas encore de statut).
export function TripHero({ reservation, children, eyebrow = 'Déplacement', titleAs: Title = 'h1', showStatus = true }) {
  const upcoming = !isTerminal(reservation) && reservation.trip_date >= todayApiDate()
  const day = formatDate(reservation.trip_date, { weekday: 'short' }).replace('.', '')
  const month = formatDate(reservation.trip_date, { month: 'short' }).replace('.', '')
  const arrivals = estimatedArrivals(reservation)
  const from = shortAddress(reservation.pickup_location)
  const to = shortAddress(reservation.destination_location)
  // Sous 1024 px, la ville seule (les adresses complètes seraient coupées)
  const fromCity = reservation.pickup_location?.city || from
  const toCity = reservation.destination_location?.city || to

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
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">{eyebrow}</p>
          <Title id="trip-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight break-words sm:text-[30px]">
            {reservation.trip_purpose}
          </Title>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
            {showStatus && <StatusBadge status={reservation.status} label={reservation.status_label} />}
            <span className="inline-flex items-center gap-1.5 text-nav-ink">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(reservation.trip_date)}
              {upcoming && ` · ${countdown(reservation.trip_date)}`}
            </span>
          </div>

          <div className="mt-5 grid max-w-xl gap-4">
            <TripLeg
              label="Aller"
              departure={formatTime(reservation.departure_time)}
              arrival={arrivals?.outbound}
              from={from}
              to={to}
              fromCity={fromCity}
              toCity={toCity}
            />
            <TripLeg
              label="Retour"
              departure={formatTime(reservation.return_time)}
              arrival={arrivals?.back}
              from={to}
              to={from}
              fromCity={toCity}
              toCity={fromCity}
            />
          </div>
        </div>

        {children && <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">{children}</div>}
      </div>
    </section>
  )
}
