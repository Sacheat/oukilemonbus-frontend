import { AlertTriangle, Check, Circle, Clock, X } from 'lucide-react'
import { cx } from '../../lib/cx'

const STATES = {
  done: { icon: Check, dot: 'bg-success text-surface', label: 'étape franchie' },
  current: { icon: Clock, dot: 'bg-primary text-on-primary ring-4 ring-primary/25', label: 'étape en cours' },
  warning: { icon: AlertTriangle, dot: 'bg-warning text-surface ring-4 ring-warning/25', label: 'étape bloquée' },
  stopped: { icon: X, dot: 'bg-danger text-on-danger', label: 'arrêt' },
  upcoming: { icon: Circle, dot: 'border-2 border-line-strong bg-surface text-line-strong', label: 'étape à venir' },
}

// Suivi en étapes (comme un colis) : chaque étape franchie est cochée avec sa date, l'étape en cours est
// mise en avant, un refus ou une annulation arrête le parcours. `steps` : [{ key, label, detail, state }]
// avec state = done | current | warning | stopped | upcoming. `horizontal` : version compacte en ligne
// (cartes), où seul le libellé et un détail court s'affichent.
export function ProgressSteps({ steps, horizontal = false }) {
  if (horizontal) {
    return (
      <ol className="flex">
        {steps.map((step, index) => {
          const state = STATES[step.state]
          const Icon = state.icon
          return (
            <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute top-3 left-1/2 w-full',
                    step.state === 'done' ? 'h-0.5 bg-success' : 'border-t-2 border-dashed border-line-strong',
                  )}
                />
              )}
              <span aria-hidden="true" className={cx('relative z-10 grid size-6 place-items-center rounded-full', state.dot)}>
                <Icon className={cx('size-3.5', step.state === 'upcoming' && 'size-2 fill-current')} />
              </span>
              <span className={cx('mt-1.5 px-1 text-xs font-bold', step.state === 'upcoming' && 'text-muted')}>
                {step.label}
                <span className="sr-only"> ({state.label})</span>
              </span>
              {step.detail && <span className="px-1 text-[11px] text-muted">{step.detail}</span>}
            </li>
          )
        })}
      </ol>
    )
  }

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
