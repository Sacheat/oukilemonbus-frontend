import { Repeat, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatTime } from '../../lib/dates'
import { rowHints } from '../../lib/queue'
import { totalPassengers } from '../../lib/reservations'
import { STATUS_DOTS } from '../../lib/trips'
import { Badge } from '../ui/Badge'

// Bordure gauche d'une demande urgente (encore à traiter, trajet dans 3 jours au plus), si elle n'est pas ouverte
const URGENCY_BORDERS = { danger: 'border-danger', warning: 'border-warning' }

// Une réservation dans la file de l'espace gestion, en ligne compacte sous l'en-tête de son jour : heure, motif,
// organisation et passagers, repères (Collège, affectation manquante), statut, urgence, série et conflits ouverts.
// `to` : même page avec ?reservation=id (le détail s'ouvre à côté) ; `selected` : réservation ouverte ;
// `urgency` : 'danger', 'warning' ou null (urgencyOf) ; `showStatus` : statut affiché (file de plusieurs statuts,
// showsRowStatus ; dans une file d'un seul statut, la pastille le dit déjà et le motif garde la place).
export function QueueRow({ reservation, to, selected, urgency, showStatus = true }) {
  const openConflicts = (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved).length
  const hints = rowHints(reservation)

  return (
    <li>
      <Link
        to={to}
        aria-current={selected ? 'true' : undefined}
        className={cx(
          // scroll-mt : une ligne ouverte au clavier ne passe pas sous l'en-tête collant de son jour
          'flex min-h-11 scroll-mt-9 items-center gap-3 border-l-[3px] px-4 py-2.5 hover:bg-surface-muted',
          selected ? 'border-primary bg-soft hover:bg-soft' : (URGENCY_BORDERS[urgency] ?? 'border-transparent'),
        )}
      >
        <span className="w-12 shrink-0 text-sm font-bold tabular-nums">{formatTime(reservation.departure_time)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{reservation.trip_purpose}</span>
            {reservation.recurrence_id && <Repeat className="size-3.5 shrink-0 text-link" aria-label="Série" />}
          </span>
          <span className="block truncate text-sm text-muted">
            {[reservation.organization?.name, `${totalPassengers(reservation)} pers.`].filter(Boolean).join(' · ')}
          </span>
          {hints.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1">
              {hints.map((hint) => (
                <Badge key={hint.label} tone={hint.tone} className="px-1.5 py-0.5 text-[11px]">
                  {hint.label}
                </Badge>
              ))}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-xs empty:hidden">
          {showStatus && (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span aria-hidden="true" className={cx('size-2 rounded-full', STATUS_DOTS[reservation.status])} />
              {reservation.status_label}
            </span>
          )}
          {urgency && (
            <span className={cx('font-bold', urgency === 'danger' ? 'text-danger' : 'text-warning')}>Urgent</span>
          )}
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
