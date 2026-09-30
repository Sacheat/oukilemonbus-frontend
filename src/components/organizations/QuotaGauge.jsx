import { cx } from '../../lib/cx'

// Quota annuel de réservations d'une organisation : jauge (bleue, orange à 80 %, rouge une fois atteint),
// « 3 / 20 réservations cette année » et places restantes
export function QuotaGauge({ used = 0, quota, className }) {
  const ratio = quota > 0 ? used / quota : 1
  const left = Math.max(0, quota - used)
  const tone = ratio >= 1 ? 'bg-danger' : ratio >= 0.8 ? 'bg-warning' : 'bg-primary'

  return (
    <div className={className}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span>
          <strong className="tabular-nums">
            {used} / {quota}
          </strong>{' '}
          <span className="text-muted">réservations cette année</span>
        </span>
        <span className={cx('text-xs font-semibold', ratio >= 1 ? 'text-danger' : 'text-muted')}>
          {left > 0 ? `${left} restante${left > 1 ? 's' : ''}` : 'Quota atteint'}
        </span>
      </p>
      <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
        <div className={cx('h-full rounded-full', tone)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    </div>
  )
}
