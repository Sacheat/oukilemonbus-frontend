import { formatDate } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { workingDaysOf } from '../../lib/planning'
import { reportOf } from '../../lib/tripReports'
import { PlanningTripCard } from './PlanningTripCard'

// Vue semaine : une colonne par jour, du lundi au vendredi (les uns sous les autres sur petit écran).
// `tripsGroupedByDay` : { "AAAA-MM-JJ": [trajets] } ; `today` met en évidence le jour en cours.
export function PlanningWeek({ weekStart, tripsGroupedByDay, today, onOpenTrip, reports, progress }) {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {workingDaysOf(weekStart).map((day) => {
        const dayTrips = tripsGroupedByDay[day] ?? []
        const isToday = day === today
        return (
          <section
            key={day}
            aria-label={formatDate(day)}
            className={cx(
              'flex min-w-0 flex-col gap-2 rounded-panel border p-2',
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
                <PlanningTripCard key={trip.reservation_id} trip={trip} onOpen={onOpenTrip} compact report={reportOf(reports, trip.reservation_id)} progress={progress?.[trip.reservation_id]} />
              ))
            )}
          </section>
        )
      })}
    </div>
  )
}
