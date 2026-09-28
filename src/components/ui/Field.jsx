import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { cx } from '../../lib/cx'

const CONTROL = cx(
  'block min-h-11.5 w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5',
  'font-normal text-ink placeholder:text-muted',
  'aria-invalid:border-danger',
)

// Libellé + champ + aide + erreur. `children` reçoit les props d'accessibilité à poser sur le champ :
//   <Field label="Email" error={errors.email}>{(props) => <Input type="email" {...props} />}</Field>
export function Field({ label, hint, error, required, className, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cx('text-sm font-bold', className)}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="mt-1.5">
        {children({
          id,
          required,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': cx(hintId, errorId) || undefined,
        })}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs font-normal text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...props }) {
  return <input className={cx(CONTROL, className)} {...props} />
}

// Champ mot de passe avec bouton pour afficher ou masquer la saisie
export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cx(CONTROL, 'pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted hover:text-ink"
      >
        {visible ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
      </button>
    </div>
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(CONTROL, className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(CONTROL, 'min-h-24', className)} {...props} />
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cx('inline-flex min-h-11 items-center gap-2 text-sm', className)}>
      <input type="checkbox" className="size-4 accent-primary" {...props} />
      {label}
    </label>
  )
}
