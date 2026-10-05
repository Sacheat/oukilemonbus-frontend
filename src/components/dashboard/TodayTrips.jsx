import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatTime } from '../../lib/dates'
import { planningDayLink } from '../../lib/dashboard'
import { Badge } from '../ui/Badge'
import { StatusBadge } from '../ui/StatusBadge'

// Trajets actifs du jour (GET /dashboard → today.trips), dans l'ordre des départs.
// Chaque ligne ouvre le trajet dans le Planning si `linkable` (permission reservations.view).
export function TodayTrips({ trips, linkable }) {
  if (trips.length === 0) {
    return <p className="px-5 py-6 text-sm text-muted">Aucun trajet prévu aujourd’hui.</p>
  }

  return (
    <ul className="divide-y divide-line">
      {trips.map((trip) => {
        const content = (
          <>
            <span className="shrink-0 font-bold tabular-nums sm:w-24">
              {formatTime(trip.departure_time)} – {formatTime(trip.return_time)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold break-words">{trip.organization?.name ?? 'Organisation inconnue'}</span>
              {trip.trip_purpose && <span className="block text-muted break-words">{trip.trip_purpose}</span>}
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-muted">
                {trip.driver && trip.vehicle ? (
                  <span>
                    {trip.driver.full_name} · {trip.vehicle.licence_plate}
                  </span>
                ) : (
                  <Badge tone="warning">Non affecté</Badge>
                )}
                <StatusBadge status={trip.status} label={trip.status_label} className="sm:hidden" />
              </span>
            </span>
            <span className="hidden shrink-0 items-center gap-1 sm:flex">
              <StatusBadge status={trip.status} label={trip.status_label} />
              {linkable && <ChevronRight className="size-4 text-muted" aria-hidden="true" />}
            </span>
          </>
        )
        // Petit écran : l'heure au-dessus, le statut sous l'organisation ; à partir de sm, trois colonnes
        const rowClass = 'flex min-h-11 flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-start sm:gap-3'
        return (
          <li key={trip.id}>
            {linkable ? (
              <Link to={planningDayLink(trip.trip_date, trip.id)} className={`${rowClass} transition hover:bg-surface-muted`}>
                {content}
              </Link>
            ) : (
              <div className={rowClass}>{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
