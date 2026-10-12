import { Minus, Plus } from 'lucide-react'
import { cx } from '../../lib/cx'

const BUTTON = cx(
  'grid size-11.5 shrink-0 place-items-center rounded-lg border border-line-strong bg-surface text-link',
  'hover:bg-soft disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50 disabled:hover:bg-surface',
)

// Nombre entier avec boutons − / + (cibles de 44 px, `step` par appui, 1 par défaut) ; le champ reste saisissable au clavier.
// `value` est une chaîne (valeur de formulaire), `onChange` reçoit la nouvelle chaîne.
// Les props restantes (id, aria-*) viennent de <Field> et vont sur le champ.
export function NumberStepper({ value, onChange, min = 0, max, step = 1, decrementLabel, incrementLabel, ...inputProps }) {
  const number = Number(value || 0)
  const set = (next) => onChange(String(Math.max(min, max != null ? Math.min(max, next) : next)))

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={BUTTON} onClick={() => set(number - step)} disabled={number <= min} aria-label={decrementLabel}>
        <Minus className="size-4.5" aria-hidden="true" />
      </button>
      <input
        {...inputProps}
        type="number"
        inputMode="numeric"
        min={min}
        max={max ?? undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block min-h-11.5 w-20 rounded-lg border border-line-strong bg-surface px-2 py-2.5 text-center text-lg font-bold text-ink tabular-nums aria-invalid:border-danger"
      />
      <button
        type="button"
        className={BUTTON}
        onClick={() => set(number + step)}
        disabled={max != null && number >= max}
        aria-label={incrementLabel}
      >
        <Plus className="size-4.5" aria-hidden="true" />
      </button>
    </div>
  )
}
