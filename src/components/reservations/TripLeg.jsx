import { Bus } from 'lucide-react'
import { cx } from '../../lib/cx'

// Apparences : `hero` sur le bandeau sombre du détail, `card` sur une carte claire (ticket de l'accueil)
const VARIANTS = {
  hero: {
    label: 'text-nav-ink',
    time: 'text-xl',
    soft: 'text-nav-ink',
    line: 'border-white/40',
    start: 'bg-white',
    end: 'border-white bg-(--hero-to)',
  },
  card: {
    label: 'text-muted',
    time: 'text-lg',
    soft: 'text-muted',
    line: 'border-line-strong',
    start: 'bg-link',
    end: 'border-link bg-surface',
  },
}

// Un trajet (aller ou retour) : heure de départ, ligne avec le bus, heure d'arrivée estimée
// (préfixée de « ~ »), puis les deux lieux. `arrival` est déjà arrondi (« 10:20 ») ou vide si le backend
// ne l'a pas calculé. `fromCity` / `toCity` (facultatifs) remplacent les adresses sous 1024 px.
// La partie visuelle est masquée aux lecteurs d'écran, qui lisent la phrase finale.
export function TripLeg({ label, departure, arrival, from, to, fromCity, toCity, variant = 'hero' }) {
  const style = VARIANTS[variant]

  return (
    <div className="min-w-0">
      <div aria-hidden="true">
        <p className={cx('text-[11px] font-extrabold tracking-[.14em] uppercase', style.label)}>{label}</p>
        <div className="mt-1 flex items-center gap-3">
          <span className={cx('shrink-0 font-bold tabular-nums', style.time)}>{departure}</span>
          <span className={cx('relative h-0 min-w-12 flex-1 border-t-2 border-dashed', style.line)}>
            <span className={cx('absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full', style.start)} />
            {variant === 'hero' ? (
              <span className="absolute top-1/2 left-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-accent text-on-accent">
                <Bus className="size-4" />
              </span>
            ) : (
              <Bus className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 bg-surface px-0.5 text-link transition-transform duration-500 group-hover:translate-x-6 motion-reduce:transition-none" />
            )}
            <span className={cx('absolute top-1/2 -right-1 size-2.5 -translate-y-1/2 rounded-full border-2', style.end)} />
          </span>
          {arrival && (
            <span title="Heure d’arrivée estimée" className={cx('shrink-0 font-bold tabular-nums', style.time, style.soft)}>
              ~{arrival}
            </span>
          )}
        </div>
        <div className={cx('mt-1.5 flex justify-between gap-4 text-sm', style.soft)}>
          <span className="min-w-0 truncate">
            {fromCity && <span className="lg:hidden">{fromCity}</span>}
            <span className={cx(fromCity && 'hidden lg:inline')}>{from}</span>
          </span>
          <span className="min-w-0 truncate text-right">
            {toCity && <span className="lg:hidden">{toCity}</span>}
            <span className={cx(toCity && 'hidden lg:inline')}>{to}</span>
          </span>
        </div>
      </div>
      <p className="sr-only">
        {label} : départ à {departure} de {from}
        {arrival ? `, arrivée estimée vers ${arrival} à ${to}.` : `, vers ${to}.`}
      </p>
    </div>
  )
}

