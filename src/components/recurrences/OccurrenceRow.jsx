import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate } from '../../lib/dates'
import { StatusBadge } from '../ui/StatusBadge'

const ROW_DATE = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }

// Une occurrence d'une série : date, statut et lien vers le détail du déplacement
export function OccurrenceRow({ reservation }) {
  const date = formatDate(reservation.trip_date, ROW_DATE)
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5">
      <span className="min-w-36 text-sm font-semibold first-letter:uppercase">{date}</span>
      <StatusBadge status={reservation.status} label={reservation.status_label} />
      <Link
        to={`/espace/deplacements/${reservation.id}`}
        className="ml-auto inline-flex min-h-11 items-center gap-1 text-sm font-bold text-link hover:underline"
        aria-label={`Ouvrir le trajet du ${date}`}
      >
        Ouvrir <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </li>
  )
}
