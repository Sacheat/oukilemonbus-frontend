import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'

const TONES = {
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
  neutral: 'text-ink',
}

// Ligne « Aujourd'hui » d'une carte de véhicule ou de chauffeur (fleetDayState) et lien vers le Planning du jour
// filtré sur cette ressource. `state` null : rien (encore inconnu, ou ressource retirée du service).
export function FleetDayStatus({ state, planningHref }) {
  if (!state) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line px-5.5 py-2.5 text-sm">
      <p className="min-w-0">
        <span className="font-semibold text-muted">Aujourd’hui : </span>
        <span className={cx('font-semibold', TONES[state.tone])}>{state.text}</span>
        {state.detail && <span className="block break-words text-muted">{state.detail}</span>}
      </p>
      {planningHref && (
        <Link to={planningHref} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-link hover:underline">
          <CalendarDays className="size-4" aria-hidden="true" /> Planning du jour
        </Link>
      )}
    </div>
  )
}
