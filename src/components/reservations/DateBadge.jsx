import { dateBadgeParts } from '../../lib/dates'
import { cx } from '../../lib/cx'

// Pastille de date de la DA : "20 / OCT."
export function DateBadge({ date, className }) {
  const { day, month } = dateBadgeParts(date)
  return (
    <div
      className={cx(
        'inline-block min-w-[62px] rounded-[10px] bg-accent px-3 py-2 text-center leading-none font-bold text-on-accent',
        className,
      )}
    >
      <span className="block text-[27px]">{day}</span>
      <span className="mt-1 block text-[10px]">{month}</span>
    </div>
  )
}
