import { cx } from '../../lib/cx'

// Choix exclusif en segments collés (période, sous-filtre d'une file), plus discret qu'une rangée de pastilles.
// `options` : [{ value, label, count?, dot? }] (count null : en chargement ; dot : classe de couleur) ;
// `label` : nom du groupe pour l'accessibilité. Hauteur totale de 44 px (cible tactile).
export function SegmentedControl({ label, options, value, onChange, className }) {
  return (
    <div role="group" aria-label={label} className={cx('inline-flex rounded-control border border-line-strong bg-surface p-1', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap',
              selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.dot && (
              <span aria-hidden="true" className={cx('size-2 rounded-full', option.dot, selected && 'ring-2 ring-on-primary/70')} />
            )}
            {option.label}
            {option.count !== undefined && (
              <span className={cx('text-xs tabular-nums', selected ? 'text-on-primary/80' : 'text-muted')}>
                {option.count ?? '…'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
