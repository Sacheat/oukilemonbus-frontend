import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { countLabel, planningDayLink, weekBars } from '../../lib/dashboard'

const TRIP_LABELS = ['trajet', 'trajets']

// Histogramme des trajets actifs d'aujourd'hui à J+6 (GET /dashboard → week.trips_by_day).
// Une barre par jour, le nombre au-dessus, une infobulle au survol ; un clic ouvre le Planning sur ce jour si `linkable`.
// Semaine sans trajet : une phrase plutôt que sept zéros.
export function WeekChart({ days, linkable }) {
  const bars = weekBars(days)

  if (bars.every((bar) => bar.count === 0)) {
    return <p className="px-5 py-6 text-sm text-muted">Aucun trajet prévu sur les 7 prochains jours.</p>
  }

  return (
    <ol className="grid grid-cols-7 gap-1.5 px-4 pt-4 pb-3" aria-label="Trajets des 7 prochains jours">
      {bars.map((bar) => {
        const fullDate = formatDate(bar.date)
        const label = `${bar.isToday ? 'Aujourd’hui, ' : ''}${fullDate} : ${bar.count} ${countLabel(bar.count, TRIP_LABELS)}`
        const content = (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs font-semibold whitespace-nowrap text-surface opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {formatDate(bar.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {bar.count}{' '}
              {countLabel(bar.count, TRIP_LABELS)}
            </span>
            <span className="flex h-24 w-full flex-col items-center justify-end gap-1">
              <span className={cx('text-sm font-bold tabular-nums', bar.count === 0 && 'text-muted')}>{bar.count}</span>
              {bar.count > 0 ? (
                <span
                  className={cx(
                    'block w-full max-w-9 rounded-t-[4px] transition',
                    bar.isToday ? 'bg-primary' : 'bg-primary/55',
                    linkable && 'group-hover:bg-primary-hover',
                  )}
                  style={{ height: `${bar.height}%` }}
                />
              ) : (
                <span className="block h-0.5 w-full max-w-9 rounded-full bg-line-strong" />
              )}
            </span>
            <span className={cx('mt-1.5 block text-xs capitalize', bar.isToday ? 'font-bold text-ink' : 'text-muted')}>
              {bar.isToday ? 'Auj.' : formatDate(bar.date, { weekday: 'short' }).replace('.', '')}
            </span>
            <span className="block text-xs text-muted tabular-nums">{formatDate(bar.date, { day: 'numeric' })}</span>
          </>
        )
        const cellClass = 'group relative flex min-h-11 flex-col items-center rounded-control px-0.5 pb-1 text-center'
        return (
          <li key={bar.date}>
            {linkable ? (
              <Link to={planningDayLink(bar.date)} aria-label={label} className={cx(cellClass, 'hover:bg-surface-muted')}>
                {content}
              </Link>
            ) : (
              <div aria-label={label} role="group" className={cellClass}>
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
