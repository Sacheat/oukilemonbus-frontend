import { Repeat, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate, formatTime } from '../../lib/dates'
import { totalPassengers } from '../../lib/reservations'
import { STATUS_DOTS } from '../../lib/trips'

// Une réservation dans la file de l'espace gestion, en ligne compacte : date et heure, motif, organisation
// et passagers, statut, série et conflits ouverts. `to` : même page avec ?reservation=id (le détail s'ouvre
// à côté) ; `selected` : réservation ouverte.
export function QueueRow({ reservation, to, selected }) {
  const openConflicts = (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved).length
  const day = formatDate(reservation.trip_date, { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')

  return (
    <li>
      <Link
        to={to}
        aria-current={selected ? 'true' : undefined}
        className={cx(
          'flex min-h-11 items-center gap-3 border-l-[3px] px-4 py-2.5 hover:bg-surface-muted',
          selected ? 'border-primary bg-soft hover:bg-soft' : 'border-transparent',
        )}
      >
        <span className="w-20 shrink-0 text-sm leading-tight">
          <span className="block font-bold first-letter:uppercase">{day}</span>
          <span className="block text-muted tabular-nums">{formatTime(reservation.departure_time)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{reservation.trip_purpose}</span>
            {reservation.recurrence_id && <Repeat className="size-3.5 shrink-0 text-link" aria-label="Série" />}
          </span>
          <span className="block truncate text-sm text-muted">
            {[reservation.organization?.name, `${totalPassengers(reservation)} pers.`].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span aria-hidden="true" className={cx('size-2 rounded-full', STATUS_DOTS[reservation.status])} />
            {reservation.status_label}
          </span>
          {openConflicts > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-conflict">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              {openConflicts} conflit{openConflicts > 1 ? 's' : ''}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
