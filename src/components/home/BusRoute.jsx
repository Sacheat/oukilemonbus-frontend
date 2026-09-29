import { Bus } from 'lucide-react'
import { cx } from '../../lib/cx'

// Illustration décorative de la bannière : une ligne pointillée à trois arrêts
// sur laquelle un petit bus avance (immobile au milieu si « réduire les animations »)
export function BusRoute({ className }) {
  return (
    <div aria-hidden="true" className={cx('relative h-14', className)}>
      <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/35" />
      {[0, 50, 100].map((position) => (
        <span
          key={position}
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-(--hero-from)"
          style={{ left: `${position}%` }}
        />
      ))}
      <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 animate-bus-ride place-items-center rounded-xl bg-accent text-on-accent shadow-lg shadow-black/25 motion-reduce:animate-none">
        <Bus className="size-5.5" />
      </span>
    </div>
  )
}
