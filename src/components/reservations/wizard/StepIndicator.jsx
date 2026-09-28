import { cx } from '../../../lib/cx'

const WIZARD_STEPS = ['Trajet', 'Passagers', 'Vérification', 'Envoi']

// Barre d'étapes de la maquette 03 ; les étapes déjà franchies sont cliquables
export function StepIndicator({ current, onSelect }) {
  return (
    <ol className="mb-5.5 flex gap-2">
      {WIZARD_STEPS.map((label, index) => {
        const step = index + 1
        const done = step < current
        const content = (
          <>
            <span className="sr-only">Étape </span>
            {step} · {label}
            {step === current && <span className="sr-only"> (étape en cours)</span>}
          </>
        )
        return (
          <li
            key={label}
            aria-current={step === current ? 'step' : undefined}
            className={cx(
              'flex-1 border-t-4 pt-2 text-[10px] sm:text-xs',
              step <= current ? 'border-primary' : 'border-line',
              step === current ? 'font-bold text-ink' : 'text-muted',
            )}
          >
            {done && onSelect ? (
              <button type="button" onClick={() => onSelect(step)} className="text-left hover:text-ink hover:underline">
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}
