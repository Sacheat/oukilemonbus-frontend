import { formatDate } from '../../lib/dates'
import { PlanningTripCard } from './PlanningTripCard'

// Vue liste : les jours qui ont des trajets, dans l'ordre, avec leurs trajets (adresses complètes)
export function PlanningList({ tripsGroupedByDay, today, onOpenTrip, reports = {} }) {
  const days = Object.keys(tripsGroupedByDay).sort()

  return (
    <div className="grid gap-6">
      {days.map((day) => (
        <section key={day} aria-label={formatDate(day)} className="grid gap-2">
          <h2 className="text-sm font-bold first-letter:uppercase">
            {formatDate(day)}
            {day === today && <span className="ml-1.5 text-xs font-semibold text-link">aujourd'hui</span>}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {tripsGroupedByDay[day].map((trip) => (
              <PlanningTripCard key={trip.reservation_id} trip={trip} onOpen={onOpenTrip} report={reports[trip.reservation_id]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
