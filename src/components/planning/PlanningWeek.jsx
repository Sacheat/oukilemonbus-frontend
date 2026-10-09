import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { workingDaysOf } from '../../lib/planning'
import { reportOf } from '../../lib/tripReports'
import { PlanningTripCard } from './PlanningTripCard'

// Vue semaine : une colonne par jour, du lundi au vendredi. Petit écran (sous 640 px) : un jour à la fois, choisi par
// des onglets avec le nombre de trajets (`shownDay`, `onShowDay(jour)` : ?jour= de l'URL) ; de 640 à 1024 px, les
// jours les uns sous les autres. `tripsGroupedByDay` : { "AAAA-MM-JJ": [trajets] } ; `today` met en évidence le jour
// en cours.
export function PlanningWeek({ weekStart, tripsGroupedByDay, today, shownDay, onShowDay, onOpenTrip, reports, progress }) {
  const days = workingDaysOf(weekStart)

  return (
    <div className="grid gap-3">
      <div role="tablist" aria-label="Jour affiché" className="grid grid-cols-5 gap-1 rounded-control border border-line-strong bg-surface p-1 sm:hidden">
        {days.map((day) => {
          const selected = day === shownDay
          const count = (tripsGroupedByDay[day] ?? []).length
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={`${formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}, ${count} trajet${count > 1 ? 's' : ''}`}
              onClick={() => onShowDay(day)}
              className={cx(
                'grid min-h-11 place-items-center rounded-md py-1 text-xs leading-tight font-semibold',
                selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
                !selected && day === today && 'text-link',
              )}
            >
              <span className="capitalize">{formatDate(day, { weekday: 'short' }).replace('.', '')}</span>
              <span className="tabular-nums">
                {formatDate(day, { day: 'numeric' })} · {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {days.map((day) => {
          const dayTrips = tripsGroupedByDay[day] ?? []
          const isToday = day === today
          return (
            <section
              key={day}
              aria-label={formatDate(day)}
              className={cx(
                'min-w-0 flex-col gap-2 rounded-panel border p-2',
                day === shownDay ? 'flex' : 'hidden sm:flex',
                isToday ? 'border-primary bg-surface-muted' : 'border-line',
              )}
            >
              <h2 className="px-1 text-sm font-bold first-letter:uppercase">
                {formatDate(day, { weekday: 'long', day: 'numeric', month: 'short' })}
                {isToday && <span className="ml-1.5 text-xs font-semibold text-link">aujourd'hui</span>}
              </h2>
              {dayTrips.length === 0 ? (
                <p className="px-1 pb-1 text-sm text-muted">Aucun trajet</p>
              ) : (
                dayTrips.map((trip) => (
                  <PlanningTripCard
                    key={trip.reservation_id}
                    trip={trip}
                    onOpen={onOpenTrip}
                    compact
                    report={reportOf(reports, trip.reservation_id)}
                    progress={progress?.[trip.reservation_id]}
                  />
                ))
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
