import { LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'

const BOX = 'min-h-11 rounded-control px-4 py-2'

const VARIANTS = {
  primary: cx(BOX, 'bg-primary text-on-primary hover:bg-primary-hover'),
  accent: cx(BOX, 'bg-accent text-on-accent hover:brightness-95'),
  secondary: cx(BOX, 'border border-line-strong bg-surface text-ink font-semibold hover:bg-surface-muted'),
  danger: cx(BOX, 'bg-danger text-on-danger hover:opacity-90'),
  link: 'py-2 text-link hover:underline',
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
    'inline-flex items-center justify-center gap-2 font-bold transition',
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
