import { cx } from '../../lib/cx'

// Interrupteur (case à cocher avec role="switch"), cible de 44 px. `label` : texte visible à côté ;
// sans lui, passer `aria-label`. `onChange` reçoit l'événement, comme une case à cocher (form.handle).
export function Switch({ label, checked, onChange, className, ...props }) {
  return (
    <label className={cx('inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold', className)}>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors',
          'peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
          'after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform',
          'peer-checked:after:translate-x-5',
        )}
      />
      {label}
    </label>
  )
}
