import { cx } from '../../lib/cx'
import { RESERVATION_STATUS_LABELS } from '../../lib/labels'
import { calendarMonths } from '../../lib/recurrences'
import { todayApiDate } from '../../lib/reservations'
import { MonthGrid } from './MonthGrid'

// Couleur d'une date selon le statut de son trajet ; refusés et annulés barrés
const CELLS = {
  confirme: 'bg-success-soft font-bold text-success',
  approuve: 'bg-info-soft font-bold text-info',
  en_attente: 'bg-warning-soft font-bold text-warning',
  en_conflit: 'bg-conflict-soft font-bold text-conflict ring-2 ring-conflict ring-inset',
  refuse: 'bg-danger-soft text-danger line-through',
  annule: 'bg-neutral-soft text-muted line-through',
}

// Trajets d'une série sur leurs mois, colorés par statut ; aujourd'hui est cerclé.
// `reservations` : occurrences de la série (GET /recurrences/{id}).
export function OccurrencesCalendar({ recurrence, reservations }) {
  const byDate = new Map(reservations.map((reservation) => [reservation.trip_date, reservation.status]))
  const months = calendarMonths(recurrence.start_date, recurrence.end_date)
  const statuses = Object.keys(CELLS).filter((status) => [...byDate.values()].includes(status))
  const today = todayApiDate()

  function cellOf(date) {
    const status = byDate.get(date)
    if (!status) return date === today ? { className: 'ring-2 ring-primary ring-inset', label: 'Aujourd’hui' } : null
    return {
      className: cx(CELLS[status], date === today && 'outline-2 outline-primary', date < today && 'opacity-60'),
      label: `Trajet ${RESERVATION_STATUS_LABELS[status].toLowerCase()}`,
    }
  }

  return (
    <div className="grid gap-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Légende">
        {statuses.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cx('inline-block size-3.5 rounded', CELLS[status])} />
            {RESERVATION_STATUS_LABELS[status]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3.5 rounded ring-2 ring-primary ring-inset" />
          Aujourd’hui
        </li>
      </ul>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <MonthGrid key={month.key} month={month} cellOf={cellOf} />
        ))}
      </div>
    </div>
  )
}
