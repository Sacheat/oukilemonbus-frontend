import { ArrowRight, CalendarClock } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate, formatTime } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { describeFrequency, recurrenceState, seriesStubDays } from '../../lib/recurrences'
import { trackSpotlight } from '../../lib/spotlight'
import { Badge } from '../ui/Badge'
import { StatusMix } from './StatusMix'

const SHORT_DATE = { day: 'numeric', month: 'short', year: 'numeric' }

// Ville d'un lieu (la carte n'a pas la place pour l'adresse complète)
function city(location) {
  return location?.city || location?.formatted_address || null
}

// Carte d'une série, façon billet et entièrement cliquable : talon avec les jours de passage,
// motif, fréquence et horaires, trajet, période, répartition des trajets par statut, prochain trajet.
// Organisation, trajet, horaires et prochaine date ne s'affichent que si le backend les renvoie.
export function RecurrenceCard({ recurrence }) {
  const state = recurrenceState(recurrence)
  const active = state.label === 'Active'
  const frequency = describeFrequency(recurrence)
  const days = seriesStubDays(recurrence)
  const count = recurrence.reservations_count ?? recurrence.occurrence_count
  const route = [city(recurrence.pickup_location), city(recurrence.destination_location)].filter(Boolean).join(' → ')
  const times =
    recurrence.departure_time && `Aller ${formatTime(recurrence.departure_time)} · retour ${formatTime(recurrence.return_time)}`

  return (
    <li className="min-w-0">
      <Link
        to={`/espace/recurrences/${recurrence.id}`}
        onPointerMove={trackSpotlight}
        className={cx(
          'spotlight card-hover group flex overflow-hidden rounded-card border border-line bg-surface shadow-soft',
          !active && 'opacity-75 hover:opacity-100',
        )}
      >
        {/* Talon : jours de passage de la série */}
        <span
          aria-hidden="true"
          className={cx(
            'grid w-20 shrink-0 place-content-center gap-1 px-2 text-center leading-none',
            active ? 'bg-accent text-on-accent' : 'bg-neutral-soft text-neutral',
          )}
        >
          {days.map((day) => (
            <span key={day} className="text-sm font-extrabold uppercase">
              {day}
            </span>
          ))}
          {recurrence.frequency === 'bihebdomadaire' && <span className="text-[10px] font-bold">1 sem. / 2</span>}
        </span>

        <div className="min-w-0 flex-1 px-4.5 py-3.5">
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={state.tone}>{state.label}</Badge>
            {recurrence.organization && <span className="truncate text-xs text-muted">{recurrence.organization.name}</span>}
          </span>
          <span className="mt-1 block truncate text-base font-bold">{recurrence.trip_purpose ?? frequency}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {[recurrence.trip_purpose && frequency, times, route].filter(Boolean).join(' · ')}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            Du {formatDate(recurrence.start_date, SHORT_DATE)} au {formatDate(recurrence.end_date, SHORT_DATE)}
            {count != null && ` · ${count} ${count > 1 ? 'trajets' : 'trajet'}`}
          </span>

          <StatusMix counts={recurrence.status_counts} className="mt-3 max-w-md" />

          {recurrence.next_trip_date && active && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-soft px-2 py-1 text-xs font-bold text-link">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Prochain trajet {formatDate(recurrence.next_trip_date, { weekday: 'long', day: 'numeric', month: 'long' })},{' '}
              {countdown(recurrence.next_trip_date)}
            </span>
          )}
        </div>

        <span className="hidden items-center pr-4.5 text-link sm:flex">
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          <span className="sr-only">Ouvrir la série</span>
        </span>
      </Link>
    </li>
  )
}
