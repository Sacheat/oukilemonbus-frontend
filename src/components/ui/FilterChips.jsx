import { cx } from '../../lib/cx'

// Filtre en pastilles avec compteur (comme les statuts de « Mes déplacements »).
// `chips` : [{ value, label, count, dot }] (value null : « tous » ; count null : en chargement ;
// dot : classe de couleur d'une pastille devant le libellé). `label` : nom du groupe pour l'accessibilité.
export function FilterChips({ label, chips, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const selected = (chip.value ?? null) === (value || null)
        return (
          <button
            key={chip.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(chip.value)}
            className={cx(
              'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors',
              selected
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line-strong bg-surface text-ink hover:border-primary hover:text-link',
              !selected && chip.count === 0 && 'text-muted',
            )}
          >
            {chip.dot && (
              <span aria-hidden="true" className={cx('size-2 rounded-full', chip.dot, selected && 'ring-2 ring-on-primary/70')} />
            )}
            {chip.label}
            {chip.count !== undefined && (
              <span
                className={cx(
                  'min-w-6 rounded-full px-1.5 text-center text-xs tabular-nums',
                  selected ? 'bg-on-primary/20' : 'bg-neutral-soft text-muted',
                )}
              >
                {chip.count ?? '…'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
