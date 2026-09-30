import { AlertTriangle, Check, Circle, Clock, X } from 'lucide-react'
import { cx } from '../../lib/cx'
import { progressSteps } from '../../lib/tripProgress'

const STATES = {
  done: { icon: Check, dot: 'bg-success text-surface', label: 'étape franchie' },
  current: { icon: Clock, dot: 'bg-primary text-on-primary ring-4 ring-primary/25', label: 'étape en cours' },
  warning: { icon: AlertTriangle, dot: 'bg-warning text-surface ring-4 ring-warning/25', label: 'étape bloquée' },
  stopped: { icon: X, dot: 'bg-danger text-on-danger', label: 'arrêt' },
  upcoming: { icon: Circle, dot: 'border-2 border-line-strong bg-surface text-line-strong', label: 'étape à venir' },
}

// Suivi de la demande en étapes : chaque étape franchie est cochée avec sa date,
// l'étape en cours est mise en avant ; un refus ou une annulation arrête le parcours
export function TripProgress({ reservation }) {
  const steps = progressSteps(reservation)
  return (
    <ol className="grid">
      {steps.map((step, index) => {
        const state = STATES[step.state]
        const Icon = state.icon
        const last = index === steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={cx(
                  'absolute top-8 bottom-0 left-[15px] w-0.5',
                  step.state === 'done' ? 'bg-success' : 'border-l-2 border-dashed border-line-strong bg-transparent',
                )}
              />
            )}
            <span aria-hidden="true" className={cx('relative z-10 grid size-8 shrink-0 place-items-center rounded-full', state.dot)}>
              <Icon className={cx('size-4', step.state === 'upcoming' && 'size-2.5 fill-current')} />
            </span>
            <span className="min-w-0 pt-1">
              <span className={cx('block font-bold', step.state === 'upcoming' && 'text-muted')}>
                {step.label}
                <span className="sr-only"> ({state.label})</span>
              </span>
              {step.detail && <span className="block text-sm break-words text-muted">{step.detail}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
