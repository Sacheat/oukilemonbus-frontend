import { useId } from 'react'
import { cx } from '../../lib/cx'

// Choix unique en pastilles (boutons radio stylés, utilisables au clavier), avec légende, aide et erreur.
// `options` : [{ value, label }] ; `onChange(value)`.
export function ChoicePills({ legend, options, value, onChange, required = false, hint, error, className }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <fieldset className={className} aria-describedby={cx(hintId, errorId) || undefined}>
      <legend className="text-sm font-bold">
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold',
              'hover:border-primary has-checked:border-primary has-checked:bg-soft has-checked:text-link',
              'has-focus-visible:ring-2 has-focus-visible:ring-primary',
            )}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-semibold whitespace-pre-line text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
