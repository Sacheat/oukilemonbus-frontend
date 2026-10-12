import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatTime } from '../../lib/dates'
import { isCancelledMission, showsMissionStatus } from '../../lib/driverMissions'
import { shortAddress, totalPassengers } from '../../lib/reservations'
import { StatusBadge } from '../ui/StatusBadge'
import { TripReportBadge } from './TripReportBadge'

// Une mission en ligne compacte, cliquable vers son détail (listes longues : prochains jours, passées, feuille de la
// semaine). Heures, organisation, destination et passagers ; badges du compte rendu et du statut s'il n'est pas
// « Confirmé ». `report` : compte rendu (null : aucun ; undefined : inconnu, pas de badge).
export function MissionRow({ mission, report }) {
  const cancelled = isCancelledMission(mission)
  const passengerCount = totalPassengers(mission)

  return (
    <li>
      <Link
        to={`/chauffeur/missions/${mission.id}`}
        className={cx(
          'flex min-h-11 items-center gap-3 px-4 py-3 transition hover:bg-surface-muted',
          cancelled && 'opacity-75',
        )}
      >
        <span className={cx('w-16 shrink-0 font-bold tabular-nums', cancelled && 'line-through')}>
          {formatTime(mission.departure_time)}
          <span className="block text-sm font-normal text-muted">→ {formatTime(mission.return_time)}</span>
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="font-semibold break-words">{mission.organization?.name}</span>
          <span className="text-sm break-words text-muted">
            {shortAddress(mission.destination_location)} · {passengerCount} passager{passengerCount > 1 ? 's' : ''}
          </span>
          <span className="flex flex-wrap gap-1.5 empty:hidden">
            <TripReportBadge report={report} mission={mission} />
            {showsMissionStatus(mission) && <StatusBadge status={mission.status} label={mission.status_label} />}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </Link>
    </li>
  )
}
