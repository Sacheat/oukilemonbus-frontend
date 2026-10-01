import { formatDate, formatTime } from '../../lib/dates'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'

// Réservation qui attend le Collège (onglet « À décider »), cliquable pour ouvrir le panneau de décision
export function CollegeReservationRow({ reservation, onOpen }) {
  const passengerCount = reservation.nb_children + reservation.nb_adults

  return (
    <Card
      as="button"
      type="button"
      onClick={() => onOpen(reservation.id)}
      className="w-full text-left transition hover:border-line-strong hover:bg-surface-muted"
    >
      <span className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-bold">{reservation.organization?.name}</span>
        <StatusBadge status={reservation.status} label={reservation.status_label} />
      </span>
      <span className="mt-1 block text-sm first-letter:uppercase">
        {formatDate(reservation.trip_date)}, {formatTime(reservation.departure_time)} → {formatTime(reservation.return_time)}
      </span>
      <span className="mt-1 block text-sm break-words text-muted">
        {reservation.trip_purpose} · {passengerCount} passager{passengerCount > 1 ? 's' : ''} · réservation n° {reservation.id}
      </span>
    </Card>
  )
}
