import { shortAddress } from '../../lib/reservations'
import { needsAssignment, openConflicts } from '../../lib/planning'
import { cx } from '../../lib/cx'
import { Badge } from '../ui/Badge'
import { StatusBadge } from '../ui/StatusBadge'

// Un trajet du planning, cliquable pour ouvrir le détail.
// Heures = occupation réelle du bus (display.time_label du backend), puis organisation, trajet, affectation.
export function PlanningTripCard({ trip, onOpen, compact = false }) {
  const conflictCount = openConflicts(trip).length
  const missingAssignment = needsAssignment(trip)

  return (
    <button
      type="button"
      onClick={() => onOpen(trip)}
      className={cx(
        'w-full rounded-card border bg-surface p-3 text-left text-sm transition hover:border-line-strong hover:bg-surface-muted',
        conflictCount > 0 ? 'border-conflict' : 'border-line',
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="font-bold tabular-nums">{trip.display?.time_label}</span>
        <StatusBadge status={trip.status} label={trip.display?.status_label} />
      </span>
      <span className="mt-1 block font-semibold break-words">{trip.organization?.name}</span>
      {!compact && (
        <span className="mt-0.5 block text-muted break-words">
          {shortAddress(trip.pickup_location)} → {shortAddress(trip.destination_location)}
        </span>
      )}
      <span className="mt-0.5 block text-muted">
        {trip.total_passengers} passager{trip.total_passengers > 1 ? 's' : ''}
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {trip.vehicle && <span className="text-muted">{trip.vehicle.licence_plate}</span>}
        {trip.driver?.user && <span className="text-muted">· {trip.driver.user.full_name}</span>}
        {missingAssignment && <Badge tone="warning">Non affecté</Badge>}
        {conflictCount > 0 && (
          <Badge tone="conflict">
            {conflictCount} conflit{conflictCount > 1 ? 's' : ''}
          </Badge>
        )}
      </span>
    </button>
  )
}
