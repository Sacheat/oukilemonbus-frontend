import { cx } from '../../lib/cx'
import { councilStateHint } from '../../lib/councilDecisions'
import { formatTime } from '../../lib/dates'
import { totalPassengers } from '../../lib/reservations'
import { Badge } from '../ui/Badge'

// Bordure gauche d'une réservation urgente (trajet dans 3 jours au plus, urgencyOf), comme dans la file Réservations
const URGENCY_BORDERS = { danger: 'border-danger', warning: 'border-warning' }

// Réservation qui attend le Collège (onglet « À décider »), en ligne compacte sous l'en-tête de son jour : heure, motif,
// organisation et passagers, état du Collège (aucune décision ou décision reportée) à la place du statut de la
// réservation, conflit éventuel, urgence. Ouvre le panneau de décision.
export function CollegeReservationRow({ reservation, onOpen, selected, urgency }) {
  const hint = councilStateHint(reservation)

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(reservation.id)}
        aria-current={selected ? 'true' : undefined}
        className={cx(
          'flex min-h-11 w-full items-center gap-3 border-l-[3px] px-4 py-2.5 text-left hover:bg-surface-muted',
          selected ? 'border-primary bg-soft hover:bg-soft' : (URGENCY_BORDERS[urgency] ?? 'border-transparent'),
        )}
      >
        <span className="w-12 shrink-0 text-sm font-bold tabular-nums">{formatTime(reservation.departure_time)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{reservation.trip_purpose}</span>
          <span className="block truncate text-sm text-muted">
            {reservation.organization?.name} · {totalPassengers(reservation)} pers.
          </span>
          <span className="mt-1 flex flex-wrap gap-1">
            <Badge tone={hint.tone} className="px-1.5 py-0.5 text-[11px]">
              {hint.label}
            </Badge>
            {reservation.status === 'en_conflit' && (
              <Badge tone="conflict" className="px-1.5 py-0.5 text-[11px]">
                En conflit
              </Badge>
            )}
          </span>
        </span>
        {urgency && (
          <span className={cx('shrink-0 text-xs font-bold', urgency === 'danger' ? 'text-danger' : 'text-warning')}>Urgent</span>
        )}
      </button>
    </li>
  )
}
