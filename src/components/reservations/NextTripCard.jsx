import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate, formatTime } from '../../lib/dates'
import { shortAddress, totalPassengers } from '../../lib/reservations'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { DateBadge } from './DateBadge'

// « Votre prochain trajet » (maquette 01) ; `compact` pour la colonne de droite du fil (maquette 02)
export function NextTripCard({ reservation, compact = false }) {
  const link = `/espace/deplacements/${reservation.id}`
  const destination = shortAddress(reservation.destination_location)

  if (compact) {
    return (
      <Card className="p-4.5">
        <h2 className="font-bold">Votre prochain départ</h2>
        <DateBadge date={reservation.trip_date} className="my-3" />
        <p className="text-sm text-muted">
          {reservation.trip_purpose}
          <br />
          Départ à {formatTime(reservation.departure_time)}
        </p>
        <Link to={link} className="mt-1 inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
          Voir le détail <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Card>
    )
  }

  return (
    <Card className="flex flex-wrap items-center gap-4.5">
      <DateBadge date={reservation.trip_date} />
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
          {reservation.trip_purpose}
          <StatusBadge status={reservation.status} label={reservation.status_label} />
        </h3>
        <p className="mt-1 text-sm text-muted">
          {formatDate(reservation.trip_date, { weekday: 'long', day: 'numeric', month: 'long' })} · Départ{' '}
          {formatTime(reservation.departure_time)} · {totalPassengers(reservation)} passagers
          {destination && ` · Vers ${destination}`}
        </p>
      </div>
      <Link to={link} className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
        Voir le détail <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  )
}
