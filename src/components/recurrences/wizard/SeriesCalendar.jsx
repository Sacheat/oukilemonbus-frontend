import { cx } from '../../../lib/cx'
import { formatDate } from '../../../lib/dates'
import { calendarMonths } from '../../../lib/recurrences'
import { Alert } from '../../ui/Alert'
import { MonthGrid } from '../MonthGrid'

const KINDS = {
  retained: { label: 'Trajet prévu', cell: 'bg-primary font-bold text-on-primary' },
  conflict: { label: 'Trajet prévu, avec un point à régler', cell: 'bg-conflict-soft font-bold text-conflict ring-2 ring-conflict ring-inset' },
  skipped: { label: 'Date ignorée', cell: 'bg-neutral-soft text-muted line-through' },
}

const LONG_DATE = { weekday: 'long', day: 'numeric', month: 'long' }

// Aperçu de la série (réponse de POST /recurrences/preview) : un mini-calendrier par mois,
// du lundi au vendredi, puis la liste des dates à signaler avec leur motif.
export function SeriesCalendar({ preview }) {
  const retained = new Set(preview.valid_dates)
  const skipped = new Map(preview.skipped_dates.map((item) => [item.date, item.reason]))
  const conflicts = preview.conflicts_by_date ?? {}
  const conflictDates = Object.keys(conflicts).sort()
  const months = calendarMonths(preview.start_date, preview.end_date)

  function kindOf(date) {
    if (conflicts[date]) return 'conflict'
    if (retained.has(date)) return 'retained'
    if (skipped.has(date)) return 'skipped'
    return null
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm font-bold">
        {plural(preview.total_valid_occurrences, 'trajet prévu', 'trajets prévus')}
        {preview.total_skipped > 0 && ` · ${plural(preview.total_skipped, 'date ignorée', 'dates ignorées')}`}
        {conflictDates.length > 0 && ` · ${plural(conflictDates.length, 'date avec un point à régler', 'dates avec un point à régler')}`}
      </p>

      {preview.total_valid_occurrences === 0 && (
        <Alert tone="danger">
          Aucune date ne peut être retenue avec ces choix (week-ends, jours fériés et préavis de 15 jours exclus). Changez les
          jours ou la période.
        </Alert>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Légende">
        {Object.entries(KINDS).map(([kind, { label, cell }]) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cx('inline-block size-3.5 rounded', cell)} />
            {label}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <MonthGrid
            key={month.key}
            month={month}
            cellOf={(date) => {
              const kind = kindOf(date)
              return kind && { className: KINDS[kind].cell, label: KINDS[kind].label }
            }}
          />
        ))}
      </div>

      {(conflictDates.length > 0 || skipped.size > 0) && (
        <section aria-labelledby="series-issues" className="rounded-[10px] border border-line p-4">
          <h3 id="series-issues" className="text-sm font-bold">
            Dates à signaler
          </h3>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {conflictDates.map((date) => (
              <li key={date}>
                <strong className="text-conflict first-letter:uppercase">{formatDate(date, LONG_DATE)}</strong> :{' '}
                {conflicts[date].map((conflict) => conflict.message).join(' ')}
              </li>
            ))}
            {preview.skipped_dates.map((item) => (
              <li key={item.date} className="text-muted">
                <span className="line-through">{formatDate(item.date, LONG_DATE)}</span> : {item.reason}
              </li>
            ))}
          </ul>
          {conflictDates.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Ces trajets seront quand même créés ; la commune réglera les points signalés. Estimation sans calcul de distance :
              la vérification définitive a lieu à la création.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function plural(count, singular, pluralForm) {
  return `${count} ${count > 1 ? pluralForm : singular}`
}
