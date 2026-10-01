import { ArrowRight } from 'lucide-react'
import { useCallback } from 'react'
import { getReservation } from '../../api/reservations'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatTime } from '../../lib/dates'
import { totalPassengers } from '../../lib/reservations'
import { StatusBadge } from '../ui/StatusBadge'
import { OccupationTimeline } from './OccupationTimeline'

// Chevauchement : la réservation en face (related_reservation_id), en mini-carte avec « Ouvrir » pour basculer
// dessus dans la file, et la frise des deux occupations du bus. Rien si le backend ne donne pas l'autre réservation.
export function OverlapDetails({ reservation, relatedId, onOpen }) {
  const fetchRelated = useCallback((signal) => getReservation(relatedId, { signal }), [relatedId])
  const related = useApi(fetchRelated)
  const other = related.data

  if (related.error) return <p className="text-xs text-muted">La réservation n° {relatedId} n’a pas pu être chargée.</p>
  if (!other) return <p className="text-xs text-muted">Chargement de la réservation n° {relatedId}…</p>

  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-3 rounded-control border border-line bg-surface p-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={other.status} label={other.status_label} />
            n° {other.id}
            {other.council_decision_status === 'approuve' && <span className="font-semibold text-success">Collège favorable</span>}
          </p>
          <p className="mt-1 truncate font-semibold">{other.trip_purpose}</p>
          <p className="text-muted">
            {other.organization?.name} · {totalPassengers(other)} pers.
          </p>
          <p className="text-muted first-letter:uppercase">
            {formatDate(other.trip_date, { weekday: 'short', day: 'numeric', month: 'short' })}, {formatTime(other.departure_time)} →{' '}
            {formatTime(other.return_time)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpen(other.id)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-control px-2 text-sm font-semibold text-link hover:bg-surface-muted"
        >
          Ouvrir <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <OccupationTimeline current={reservation} other={other} />
    </div>
  )
}
