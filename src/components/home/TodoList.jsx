import { ArrowRight, PartyPopper } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'

const DOTS = {
  warning: 'bg-warning',
  conflict: 'bg-conflict',
  info: 'bg-primary',
  neutral: 'bg-neutral',
}

// Bloc « À faire » : ce qui attend l'usager (voir todoItems), ou « Tout est en ordre »
export function TodoList({ items }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
          <PartyPopper className="size-5" aria-hidden="true" />
        </span>
        Tout est en ordre : rien ne vous attend pour le moment.
      </div>
    )
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.key}>
          <Link to={item.to} className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted">
            <span aria-hidden="true" className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', DOTS[item.tone])} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{item.title}</span>
              <span className="block text-xs text-muted">
                {[item.date && formatDate(item.date, { weekday: 'long', day: 'numeric', month: 'long' }), item.detail]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <ArrowRight
              className="mt-1 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-link"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
