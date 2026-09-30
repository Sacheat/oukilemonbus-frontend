import { CalendarRange } from 'lucide-react'
import { cx } from '../../lib/cx'
import { formatDate, formatTime } from '../../lib/dates'
import { describeFrequency, recurrenceState, seriesStubDays } from '../../lib/recurrences'
import { estimatedArrivals, shortAddress } from '../../lib/reservations'
import { trackSpotlight } from '../../lib/spotlight'
import { TripLeg } from '../reservations/TripLeg'
import { Badge } from '../ui/Badge'

const SHORT_DATE = { day: 'numeric', month: 'long', year: 'numeric' }

// En-tête du détail d'une série, façon billet (comme TripHero) : talon avec les jours de passage,
// motif, état, fréquence et période, trajets aller et retour. Les heures d'arrivée estimées sont
// celles du prochain trajet (`nextTrip` : une réservation de la série, ou une vérification du trajet) ;
// les actions (children) à droite. Aperçu dans l'assistant : `eyebrow`, `titleAs`, `showState={false}`.
export function SeriesHero({ recurrence, nextTrip = null, children, eyebrow = 'Récurrence', titleAs: Title = 'h1', showState = true }) {
  const state = recurrenceState(recurrence)
  // Un aperçu (pas encore d'état) garde les couleurs d'une série active
  const active = !showState || state.label === 'Active'
  const frequency = describeFrequency(recurrence)
  const days = seriesStubDays(recurrence)
  const arrivals = estimatedArrivals(nextTrip)
  const from = shortAddress(recurrence.pickup_location)
  const to = shortAddress(recurrence.destination_location)
  // Sous 1024 px, la ville seule (les adresses complètes seraient coupées)
  const fromCity = recurrence.pickup_location?.city || from
  const toCity = recurrence.destination_location?.city || to

  return (
    <section
      aria-labelledby="series-title"
      onPointerMove={trackSpotlight}
      className="spotlight spotlight-warm flex flex-col overflow-hidden rounded-panel bg-hero text-white shadow-soft sm:flex-row"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className={cx(
          'relative flex shrink-0 flex-wrap place-content-center gap-x-3 gap-y-1 px-6 py-4 text-center leading-none sm:w-32 sm:flex-col',
          active ? 'bg-accent text-on-accent' : 'bg-neutral-soft text-neutral',
        )}
      >
        {days.map((day) => (
          <span key={day} className="text-xl font-extrabold uppercase">
            {day}
          </span>
        ))}
        {recurrence.frequency === 'bihebdomadaire' && <span className="text-xs font-bold">1 sem. / 2</span>}
      </div>

      <div className="grid min-w-0 flex-1 items-center gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">{eyebrow}</p>
          <Title id="series-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight break-words sm:text-[30px]">
            {recurrence.trip_purpose ?? frequency}
          </Title>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
            {showState && <Badge tone={state.tone}>{state.label}</Badge>}
            <span className="text-nav-ink">{frequency}</span>
          </div>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-nav-ink">
            <CalendarRange className="size-4" aria-hidden="true" />
            Du {formatDate(recurrence.start_date, SHORT_DATE)} au {formatDate(recurrence.end_date, SHORT_DATE)}
          </p>

          {recurrence.departure_time && (
            <div className="mt-5 grid max-w-xl gap-4">
              <TripLeg
                label="Aller"
                departure={formatTime(recurrence.departure_time)}
                arrival={arrivals?.outbound}
                from={from}
                to={to}
                fromCity={fromCity}
                toCity={toCity}
              />
              <TripLeg
                label="Retour"
                departure={formatTime(recurrence.return_time)}
                arrival={arrivals?.back}
                from={to}
                to={from}
                fromCity={toCity}
                toCity={fromCity}
              />
            </div>
          )}
        </div>

        {children && <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">{children}</div>}
      </div>
    </section>
  )
}
