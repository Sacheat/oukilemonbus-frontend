import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate, formatTime } from '../../lib/dates'
import { describeFrequency, recurrenceState } from '../../lib/recurrences'
import { shortAddress } from '../../lib/reservations'
import { Badge } from '../ui/Badge'

const SHORT_DATE = { day: 'numeric', month: 'long', year: 'numeric' }

// Carte d'une série dans la liste des récurrences. Organisation, trajet, horaires et prochaine
// date ne s'affichent que si le backend les renvoie (RecurrenceResource enrichie).
export function RecurrenceCard({ recurrence }) {
  const state = recurrenceState(recurrence)
  const frequency = describeFrequency(recurrence)
  const count = recurrence.reservations_count ?? recurrence.occurrence_count
  const pickup = shortAddress(recurrence.pickup_location)
  const destination = shortAddress(recurrence.destination_location)
  const times =
    recurrence.departure_time && `${formatTime(recurrence.departure_time)} → ${formatTime(recurrence.return_time)}`
  // Avec un motif en titre, la fréquence passe en sous-titre
  const subtitle = [recurrence.trip_purpose && frequency, times].filter(Boolean).join(' · ')

  return (
    <li>
      <article className="rounded-xl border border-line bg-surface px-5 py-4.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone={state.tone}>{state.label}</Badge>
          <Link
            to={`/espace/recurrences/${recurrence.id}`}
            className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline"
            aria-label={`Ouvrir la récurrence « ${frequency} »`}
          >
            Ouvrir <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <h3 className="mt-1 text-[17px] font-bold">{recurrence.trip_purpose ?? frequency}</h3>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <p className={cx('text-sm text-muted', !subtitle && 'mt-1')}>
          Du {formatDate(recurrence.start_date, SHORT_DATE)} au {formatDate(recurrence.end_date, SHORT_DATE)}
          {count != null && ` · ${count} ${count > 1 ? 'trajets' : 'trajet'}`}
        </p>
        {(destination || recurrence.organization) && (
          <p className="text-sm text-muted">
            {[
              destination && (pickup ? `${pickup} → ${destination}` : `Vers ${destination}`),
              recurrence.organization?.name,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {recurrence.next_trip_date && state.label === 'Active' && (
          <p className="mt-2 text-xs text-muted">Prochain trajet le {formatDate(recurrence.next_trip_date)}</p>
        )}
      </article>
    </li>
  )
}
