import { ArrowRight, Bus, CalendarDays, Users } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate, formatTime } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { shortAddress, totalPassengers } from '../../lib/reservations'
import { StatusBadge } from '../ui/StatusBadge'

// Prochain trajet présenté comme un billet pleine largeur : talon daté à gauche,
// puis le motif, le trajet départ → destination et le lien vers le détail
export function TripTicket({ reservation }) {
  const pickup = shortAddress(reservation.pickup_location)
  const destination = shortAddress(reservation.destination_location)
  const day = formatDate(reservation.trip_date, { weekday: 'short' }).replace('.', '')
  const [dayNumber, month] = formatDate(reservation.trip_date, { day: 'numeric', month: 'short' }).split(' ')

  return (
    <Link
      to={`/espace/deplacements/${reservation.id}`}
      className="card-hover group flex overflow-hidden rounded-card border border-line bg-surface shadow-soft"
      aria-label={`Votre prochain trajet : ${reservation.trip_purpose}, ${formatDate(reservation.trip_date)}, ${countdown(reservation.trip_date)}`}
    >
      {/* Talon du billet et encoches de la découpe */}
      <div aria-hidden="true" className="relative grid w-24 shrink-0 place-content-center bg-accent px-3 text-center text-on-accent sm:w-28">
        <span className="text-xs font-bold uppercase">{day}</span>
        <span className="text-[38px] leading-none font-extrabold">{dayNumber}</span>
        <span className="text-xs font-bold uppercase">{month?.replace('.', '')}</span>
        <span className="absolute -top-2 -right-2 size-4 rounded-full bg-bg" />
        <span className="absolute -right-2 -bottom-2 size-4 rounded-full bg-bg" />
      </div>

      <div className="grid min-w-0 flex-1 items-center gap-x-8 gap-y-4 border-l-2 border-dashed border-line p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">Votre prochain trajet</p>
          <p className="mt-1 truncate text-[19px] font-bold">{reservation.trip_purpose}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={reservation.status} label={reservation.status_label} />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-link">
              <CalendarDays className="size-3.5" aria-hidden="true" /> {countdown(reservation.trip_date)}
            </span>
          </div>
        </div>

        <div className="min-w-0 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tabular-nums">{formatTime(reservation.departure_time)}</span>
            <span aria-hidden="true" className="relative h-0 flex-1 border-t-2 border-dashed border-line-strong">
              <span className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full bg-link" />
              <Bus className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 bg-surface px-0.5 text-link transition-transform duration-500 group-hover:translate-x-6 motion-reduce:transition-none" />
              <span className="absolute top-1/2 -right-1 size-2.5 -translate-y-1/2 rounded-full border-2 border-link bg-surface" />
            </span>
            <span className="text-lg font-bold tabular-nums">{formatTime(reservation.return_time)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-4 text-muted">
            <span className="truncate">{pickup}</span>
            <span className="truncate text-right">{destination}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Users className="size-4" aria-hidden="true" /> {totalPassengers(reservation)} passagers
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold whitespace-nowrap text-link">
            Voir le détail <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}
