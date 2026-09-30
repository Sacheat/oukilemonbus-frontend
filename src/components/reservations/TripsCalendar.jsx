import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { formatDate, toApiDate } from '../../lib/dates'
import { RESERVATION_STATUS_LABELS } from '../../lib/labels'
import { calendarMonths, WEEK_DAYS } from '../../lib/recurrences'
import { todayApiDate } from '../../lib/reservations'
import { fetchMonthTrips, STATUS_DOTS } from '../../lib/trips'

function monthStart(date) {
  return `${date.slice(0, 7)}-01`
}

function shiftMonth(start, delta) {
  const date = new Date(`${start}T00:00:00`)
  date.setMonth(date.getMonth() + delta)
  return toApiDate(date)
}

// Mini-calendrier du mois (lundi → vendredi) : jours de trajet marqués d'un point par statut.
// Un clic sur un jour appelle onSelectDay(date, trajets du jour).
export function TripsCalendar({ organizationId, onSelectDay }) {
  const [month, setMonth] = useState(() => monthStart(todayApiDate()))
  const fetchTrips = useCallback(
    (signal) => fetchMonthTrips(month, { signal, organizationId }),
    [month, organizationId],
  )
  const trips = useApi(fetchTrips)
  const today = todayApiDate()

  const byDay = new Map()
  for (const trip of trips.data ?? []) {
    byDay.set(trip.trip_date, [...(byDay.get(trip.trip_date) ?? []), trip])
  }
  const grid = calendarMonths(month, month)[0]
  const statuses = [...new Set((trips.data ?? []).map((trip) => trip.status))]

  return (
    <section aria-labelledby="calendar-title" className="rounded-card border border-line bg-surface p-4.5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 id="calendar-title" className="font-bold first-letter:uppercase">
          {formatDate(month, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            aria-label="Mois précédent"
            className="grid size-11 place-items-center rounded-control text-muted hover:bg-surface-muted hover:text-ink"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            aria-label="Mois suivant"
            className="grid size-11 place-items-center rounded-control text-muted hover:bg-surface-muted hover:text-ink"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <table className={cx('mt-2 w-full table-fixed text-center text-sm', trips.loading && 'opacity-60')}>
        <caption className="sr-only">Trajets du mois, du lundi au vendredi</caption>
        <thead>
          <tr>
            {WEEK_DAYS.map((day) => (
              <th key={day.value} scope="col" className="pb-1 text-xs font-semibold text-muted">
                <abbr title={day.label} className="no-underline">
                  {day.short.slice(0, 1)}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week) => (
            <tr key={week.find(Boolean)}>
              {week.map((date, index) => {
                if (!date) return <td key={index} />
                const dayTrips = byDay.get(date) ?? []
                const number = Number(date.slice(8, 10))
                const isToday = date === today
                return (
                  <td key={date} className="p-0.5">
                    {dayTrips.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onSelectDay(date, dayTrips)}
                        aria-label={`${formatDate(date)} : ${dayTrips
                          .map((trip) => `${trip.trip_purpose} (${trip.status_label ?? RESERVATION_STATUS_LABELS[trip.status]})`)
                          .join(', ')}`}
                        className={cx(
                          'relative mx-auto grid size-9 place-items-center rounded-lg font-bold transition-colors hover:bg-soft hover:text-link',
                          isToday ? 'ring-2 ring-primary' : 'bg-surface-muted',
                        )}
                      >
                        {number}
                        <span aria-hidden="true" className="absolute bottom-1 flex gap-0.5">
                          {dayTrips.slice(0, 3).map((trip) => (
                            <span key={trip.id} className={cx('size-1.5 rounded-full', STATUS_DOTS[trip.status])} />
                          ))}
                        </span>
                      </button>
                    ) : (
                      <span
                        className={cx(
                          'mx-auto grid size-9 place-items-center rounded-lg text-muted',
                          isToday && 'font-bold text-ink ring-2 ring-primary',
                        )}
                      >
                        {number}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {statuses.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" aria-label="Légende">
          {statuses.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cx('size-2 rounded-full', STATUS_DOTS[status])} />
              {RESERVATION_STATUS_LABELS[status]}
            </li>
          ))}
        </ul>
      ) : (
        !trips.loading && <p className="mt-3 text-xs text-muted">Aucun trajet ce mois-ci.</p>
      )}
    </section>
  )
}
