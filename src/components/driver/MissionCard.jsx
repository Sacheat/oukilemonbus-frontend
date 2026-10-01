import { ArrowRight, Bus, Users } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatTime } from '../../lib/dates'
import { isCancelledMission } from '../../lib/driverMissions'
import { estimatedArrivals, shortAddress, totalPassengers } from '../../lib/reservations'
import { StatusBadge } from '../ui/StatusBadge'

// Une mission du chauffeur, cliquable en entier vers son détail. Lisible d'un coup d'œil sur téléphone :
// horaires en grand, puis départ → destination, passagers et véhicule. Une mission annulée reste visible,
// estompée, avec son motif, pour que le chauffeur ne se déplace pas pour rien.
// `large` : mise en avant (missions du jour).
export function MissionCard({ mission, large = false }) {
  const cancelled = isCancelledMission(mission)
  const arrivals = estimatedArrivals(mission)
  const passengerCount = totalPassengers(mission)

  return (
    <Link
      to={`/chauffeur/missions/${mission.id}`}
      className={cx(
        'group grid gap-2 rounded-card border bg-surface p-4 transition hover:border-line-strong hover:bg-surface-muted',
        cancelled ? 'border-line opacity-75' : 'border-line',
        large && 'p-5',
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className={cx('font-bold tabular-nums', large ? 'text-2xl' : 'text-lg', cancelled && 'line-through')}>
          {formatTime(mission.departure_time)} → {formatTime(mission.return_time)}
        </span>
        <StatusBadge status={mission.status} label={mission.status_label} />
      </span>

      <span className="font-semibold break-words">{mission.organization?.name}</span>

      <span className="grid gap-0.5 text-sm">
        <span className="break-words">
          <span className="text-muted">Départ :</span> {shortAddress(mission.pickup_location)}
        </span>
        <span className="break-words">
          <span className="text-muted">Destination :</span> {shortAddress(mission.destination_location)}
          {arrivals?.outbound && <span className="text-muted"> · arrivée vers {arrivals.outbound}</span>}
        </span>
      </span>

      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4" aria-hidden="true" />
          {passengerCount} passager{passengerCount > 1 ? 's' : ''}
        </span>
        {mission.vehicle && (
          <span className="inline-flex items-center gap-1.5">
            <Bus className="size-4" aria-hidden="true" />
            {mission.vehicle.licence_plate}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-link">
          Détail
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </span>

      {cancelled && mission.cancellation_reason && (
        <span className="text-sm break-words text-muted">Motif : {mission.cancellation_reason}</span>
      )}
    </Link>
  )
}
