import { useState } from 'react'
import { Link } from 'react-router'
import { useCountUp } from '../../hooks/useCountUp'
import { cx } from '../../lib/cx'
import { trackSpotlight } from '../../lib/spotlight'

const TONES = {
  primary: 'bg-soft text-link',
  warning: 'bg-warning-soft text-warning',
  conflict: 'bg-conflict-soft text-conflict',
  info: 'bg-info-soft text-info',
  neutral: 'bg-neutral-soft text-neutral',
}

// Tuile « En un coup d'œil » : icône, chiffre animé et libellé, cliquable vers la liste filtrée.
// `value` null : chargement ; `tone` passe en neutre quand il n'y a rien à signaler. Sans `to` : chiffre seul.
// Un bref halo signale un chiffre qui change après le premier chargement (rafraîchissement automatique).
export function StatTile({ to, icon: Icon, value, label, tone = 'primary' }) {
  const shown = useCountUp(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [flashCount, setFlashCount] = useState(0)
  if (value !== previousValue) {
    setPreviousValue(value)
    if (previousValue != null && value != null) setFlashCount((count) => count + 1)
  }
  const effectiveTone = value === 0 ? 'neutral' : tone
  const Tag = to ? Link : 'div'
  return (
    <Tag
      {...(to && { to, onPointerMove: trackSpotlight })}
      className={cx(
        'relative flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-soft',
        to && 'spotlight card-hover',
      )}
      role={to ? undefined : 'group'}
      aria-label={value == null ? label : `${value} ${label}`}
    >
      {flashCount > 0 && (
        <span
          key={flashCount}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-tile-flash rounded-card ring-2 ring-primary opacity-0 motion-reduce:hidden"
        />
      )}
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
    </Tag>
  )
}
