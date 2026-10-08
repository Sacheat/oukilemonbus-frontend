import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { isTripMoving, planningDayLink, tripProgressBadge } from '../../lib/dashboard'
import { formatTime } from '../../lib/dates'
import { Badge } from '../ui/Badge'
import { StatusBadge } from '../ui/StatusBadge'

// Trajets actifs du jour (GET /dashboard → today.trips), dans l'ordre des départs, avec l'avancement réel du
// chauffeur (En route, Sur place…, ou « Pas encore parti » si l'heure est passée) quand `progress` est connu.
// Le trajet en route est repéré par un liseré. Chaque ligne ouvre le trajet dans le Planning si `linkable`
// (permission reservations.view). `nowTime` : "HH:mm" à Bruxelles.
export function TodayTrips({ trips, linkable, progress, nowTime }) {
  if (trips.length === 0) {
    return <p className="px-5 py-6 text-sm text-muted">Aucun trajet prévu aujourd’hui.</p>
  }

  return (
    <ul className="divide-y divide-line">
      {trips.map((trip) => {
        const badge = tripProgressBadge(trip, progress?.[trip.id], nowTime)
        const moving = isTripMoving(progress?.[trip.id])
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
                {badge && (
                  <Badge tone={badge.tone} className="sm:hidden">
                    {badge.label}
                  </Badge>
                )}
              </span>
            </span>
            <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
              <StatusBadge status={trip.status} label={trip.status_label} />
              {linkable && <ChevronRight className="size-4 text-muted" aria-hidden="true" />}
            </span>
          </>
        )
        // Petit écran : l'heure au-dessus, le statut sous l'organisation ; à partir de sm, trois colonnes
        const rowClass = cx(
          'flex min-h-11 flex-col gap-1 border-l-4 px-5 py-3 text-sm sm:flex-row sm:items-start sm:gap-3',
          moving ? 'border-l-info bg-surface-muted' : 'border-l-transparent',
        )
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
