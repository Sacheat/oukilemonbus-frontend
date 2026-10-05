import { ArrowRight } from 'lucide-react'
import { useCallback } from 'react'
import { Link } from 'react-router'
import { getReservations } from '../../api/reservations'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatTime } from '../../lib/dates'
import { organizationReservationsPath } from '../../lib/organizationsAdmin'
import { todayInBrussels } from '../../lib/planning'
import { ACTIVE_STATUSES } from '../../lib/planning'
import { StatusBadge } from '../ui/StatusBadge'

// Réservations d'une organisation, en résumé : nombre à venir et cette année (calculés par le backend), les 3
// prochaines (une seule petite requête), et le lien vers la file des réservations filtrée sur l'organisation.
export function OrganizationReservations({ organization }) {
  const fetchNext = useCallback(
    (signal) =>
      getReservations(
        { organization_id: organization.id, date_from: todayInBrussels(), statuses: ACTIVE_STATUSES, sort: 'asc', page: 1 },
        { signal },
      ).then((response) => response.data.slice(0, 3)),
    [organization.id],
  )
  const next = useApi(fetchNext)
  const quota = organization.quota

  return (
    <div className="grid gap-3">
      <p className="text-sm">
        <strong>{organization.upcoming_reservations_count}</strong> à venir
        {quota && (
          <>
            {' '}
            · <strong>{quota.used}</strong> approuvée{quota.used > 1 ? 's' : ''} ou confirmée{quota.used > 1 ? 's' : ''} en {quota.year}
          </>
        )}
      </p>
      {next.data?.length > 0 && (
        <ul className="grid gap-1.5 text-sm">
          {next.data.map((reservation) => (
            <li key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-surface-muted px-3 py-2">
              <span className="first-letter:uppercase">
                {formatDate(reservation.trip_date, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(reservation.departure_time)} → {formatTime(reservation.return_time)}
              </span>
              <StatusBadge status={reservation.status} label={reservation.status_label} />
            </li>
          ))}
        </ul>
      )}
      <Link to={organizationReservationsPath(organization.id)} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-link">
        Voir ses réservations dans la file <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
