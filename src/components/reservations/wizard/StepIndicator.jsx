import { Check } from 'lucide-react'
import { cx } from '../../../lib/cx'

const DEFAULT_STEPS = ['Trajet', 'Passagers', 'Vérification']

// Barre d'étapes de la maquette 03, en pastilles reliées (comme le suivi d'une demande) :
// coche pour les étapes franchies (cliquables pour y revenir), pastille cerclée pour l'étape en cours.
// Sur mobile, seul le libellé de l'étape en cours est affiché.
export function StepIndicator({ current, onSelect, steps = DEFAULT_STEPS, lastLabel = 'Envoi' }) {
  const labels = [...steps, lastLabel]

  return (
    <ol className="mb-6 flex">
      {labels.map((label, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        const content = (
          <>
            <span
              aria-hidden="true"
              className={cx(
                'relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
                done && 'bg-primary text-on-primary',
                active && 'bg-surface text-primary ring-2 ring-primary',
                !done && !active && 'border-2 border-line bg-surface text-muted',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : step}
            </span>
            <span
              className={cx(
                'text-xs',
                active ? 'font-bold text-ink' : 'text-muted',
                !active && 'sr-only sm:not-sr-only',
                done && onSelect && 'group-hover:underline',
              )}
            >
              <span className="sr-only">Étape {step} : </span>
              {label}
              {active && <span className="sr-only"> (étape en cours)</span>}
              {done && <span className="sr-only"> (terminée)</span>}
            </span>
          </>
        )

        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="relative flex flex-1 flex-col items-center text-center">
            {/* Trait vers l'étape suivante, plein une fois l'étape franchie */}
            {index < labels.length - 1 && (
              <span
                aria-hidden="true"
                className={cx('absolute top-4 left-1/2 h-0.5 w-full -translate-y-1/2', done ? 'bg-primary' : 'bg-line')}
              />
            )}
            {done && onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(step)}
                className="group flex min-h-11 min-w-11 flex-col items-center gap-1.5 rounded-control"
              >
                {content}
              </button>
            ) : (
              <div className="flex min-h-11 flex-col items-center gap-1.5">{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
