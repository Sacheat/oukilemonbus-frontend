import { cx } from '../../lib/cx'
import { formatTime } from '../../lib/dates'
import { PROGRESS_BADGES } from '../../lib/driverJourney'
import { needsAssignment, openConflicts } from '../../lib/planning'
import { shortAddress } from '../../lib/reservations'
import { TripReportBadge } from '../driver/TripReportBadge'
import { Badge } from '../ui/Badge'
import { StatusBadge } from '../ui/StatusBadge'

// Un trajet du planning, cliquable pour ouvrir le détail.
// Heures du trajet (départ – retour, comme la file et le tableau de bord ; l'occupation du bus, marges comprises, est
// dans le détail), organisation, destination, passagers, puis affectation et badges. Le statut n'est affiché que s'il
// n'est pas « Confirmé » (l'état normal) : en attente, approuvé, en conflit, refusé, annulé ressortent.
// `compact` (vue semaine) : la ville de destination seulement ; sinon les deux adresses.
// `report` : compte rendu du chauffeur (Réalisé, Non réalisé, Compte rendu attendu, Sans compte rendu), undefined
// tant qu'il n'est pas connu ; `progress` : avancement réel (En route, Sur place…).
export function PlanningTripCard({ trip, onOpen, compact = false, report, progress }) {
  const progressBadge = progress?.state !== 'termine' ? PROGRESS_BADGES[progress?.state] : null
  const conflictCount = openConflicts(trip).length
  const missingAssignment = needsAssignment(trip)
  // Ville de destination ; la rue quand le trajet reste dans la ville de départ (« → Dinant » ne dirait rien)
  const destinationCity = trip.destination_location?.city
  const destination =
    destinationCity && destinationCity !== trip.pickup_location?.city
      ? destinationCity
      : (trip.destination_location?.street ?? shortAddress(trip.destination_location))

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
        <span className="font-bold tabular-nums">
          {formatTime(trip.departure_time)} – {formatTime(trip.return_time)}
        </span>
        {trip.status !== 'confirme' && <StatusBadge status={trip.status} label={trip.display?.status_label} />}
      </span>
      <span className="mt-1 block font-semibold break-words">{trip.organization?.name}</span>
      <span className="mt-0.5 block text-muted break-words">
        {compact ? (
          <>
            → {destination} · {trip.total_passengers} pers.
          </>
        ) : (
          <>
            {shortAddress(trip.pickup_location)} → {shortAddress(trip.destination_location)} · {trip.total_passengers}{' '}
            passager{trip.total_passengers > 1 ? 's' : ''}
          </>
        )}
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {(trip.vehicle || trip.driver?.user) && (
          <span className="text-muted">
            {[trip.vehicle?.licence_plate, trip.driver?.user?.full_name].filter(Boolean).join(' · ')}
          </span>
        )}
        {missingAssignment && <Badge tone="warning">Non affecté</Badge>}
        {progressBadge && <Badge tone={progressBadge.tone}>{progressBadge.label}</Badge>}
        <TripReportBadge report={report} mission={trip} audience="agent" />
        {conflictCount > 0 && (
          <Badge tone="conflict">
            {conflictCount} conflit{conflictCount > 1 ? 's' : ''}
          </Badge>
        )}
      </span>
    </button>
  )
}
