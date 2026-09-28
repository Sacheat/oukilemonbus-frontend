import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate, formatTime } from '../../lib/dates'
import { shortAddress, statusHint, totalPassengers } from '../../lib/reservations'
import { StatusBadge } from '../ui/StatusBadge'

// Étape du fil de suivi (maquette 02) : pastille sur la ligne du temps + carte
export function ReservationEvent({ reservation }) {
  const destination = shortAddress(reservation.destination_location)
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className="absolute top-6 -left-[36px] size-3.5 rounded-full border-3 border-bg bg-primary ring-2 ring-primary"
      />
      <article className="rounded-xl border border-line bg-surface px-5 py-4.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={reservation.status} label={reservation.status_label} />
          <Link
            to={`/espace/deplacements/${reservation.id}`}
            className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline"
            aria-label={`Ouvrir le déplacement « ${reservation.trip_purpose} »`}
          >
            Ouvrir <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <h3 className="mt-1 text-[17px] font-bold">{reservation.trip_purpose}</h3>
        <p className="mt-1 text-sm text-muted">
          {formatDate(reservation.trip_date, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
          {formatTime(reservation.departure_time)} → {formatTime(reservation.return_time)} ·{' '}
          {totalPassengers(reservation)} passagers
        </p>
        <p className="text-sm text-muted">
          {[destination && `Vers ${destination}`, reservation.organization?.name].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-2 text-xs text-muted">{statusHint(reservation)}</p>
      </article>
    </li>
  )
}
