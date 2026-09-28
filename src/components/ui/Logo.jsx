import { Bus } from 'lucide-react'
import { cx } from '../../lib/cx'

export function Logo({ className }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-[19px] font-extrabold tracking-tight whitespace-nowrap', className)}>
      <span className="grid size-7.5 place-items-center rounded-control bg-accent text-on-accent">
        <Bus className="size-4.5" aria-hidden="true" />
      </span>
      OUKILEMONBUS
    </span>
  )
}
