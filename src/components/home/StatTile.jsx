import { Link } from 'react-router'
import { useCountUp } from '../../hooks/useCountUp'
import { cx } from '../../lib/cx'

const TONES = {
  primary: 'bg-soft text-link',
  warning: 'bg-warning-soft text-warning',
  conflict: 'bg-conflict-soft text-conflict',
  info: 'bg-info-soft text-info',
  neutral: 'bg-neutral-soft text-neutral',
}

// Tuile « En un coup d'œil » : icône, chiffre animé et libellé, cliquable vers la liste filtrée.
// `value` null : chargement ; `tone` passe en neutre quand il n'y a rien à signaler.
export function StatTile({ to, icon: Icon, value, label, tone = 'primary' }) {
  const shown = useCountUp(value)
  const effectiveTone = value === 0 ? 'neutral' : tone
  return (
    <Link
      to={to}
      className="card-hover flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-soft"
      aria-label={value == null ? label : `${value} ${label}`}
    >
      <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl', TONES[effectiveTone])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span aria-hidden="true" className="block text-[26px] leading-none font-bold tabular-nums">
          {shown ?? '–'}
        </span>
        <span aria-hidden="true" className="mt-1 block text-sm text-muted">
          {label}
        </span>
      </span>
    </Link>
  )
}
