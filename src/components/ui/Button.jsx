import { LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  accent: 'bg-accent text-on-accent hover:brightness-95',
  secondary: 'border border-line-strong bg-surface text-ink font-semibold hover:bg-surface-muted',
  danger: 'bg-danger text-on-danger hover:opacity-90',
  link: 'min-h-0 px-0 py-2 text-link hover:underline',
}

// <Button> classique, ou lien stylé en bouton avec la prop `to`
export function Button({
  variant = 'primary',
  to,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}) {
  const classes = cx(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 font-bold transition',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
