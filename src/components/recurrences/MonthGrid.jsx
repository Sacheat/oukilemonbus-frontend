import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { WEEK_DAYS } from '../../lib/recurrences'

// Un mois en mini-calendrier, du lundi au vendredi (`month` : élément de calendarMonths()).
// `cellOf(date)` renvoie { className, label } pour une date à mettre en valeur, ou null.
export function MonthGrid({ month, cellOf }) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-1 text-center text-xs">
      <caption className="pb-1 text-left text-sm font-bold first-letter:uppercase">
        {formatDate(month.date, { month: 'long', year: 'numeric' })}
      </caption>
      <thead>
        <tr>
          {WEEK_DAYS.map((day) => (
            <th key={day.value} scope="col" className="font-semibold text-muted">
              <abbr title={day.label} className="no-underline">
                {day.short}
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {month.weeks.map((week) => (
          <tr key={week.find(Boolean)}>
            {week.map((date, index) => {
              if (!date) return <td key={index} />
              const cell = cellOf(date)
              return (
                <td key={date} className={cx('h-7 rounded tabular-nums', cell ? cell.className : 'text-muted')}>
                  {Number(date.slice(8, 10))}
                  {cell && <span className="sr-only"> : {cell.label.toLowerCase()}</span>}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
