import { cx } from '../../lib/cx'
import { STATUS_CHIPS, STATUS_DOTS } from '../../lib/trips'

// Filtre par statut en pastilles, avec le nombre de trajets de chaque statut (null : en chargement)
export function StatusChips({ value, counts, onChange }) {
  return (
    <div role="group" aria-label="Statut" className="flex flex-wrap gap-2">
      {STATUS_CHIPS.map((chip) => {
        const selected = (chip.value ?? null) === (value || null)
        const count = counts?.[chip.value ?? 'tous']
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
              !selected && count === 0 && 'text-muted',
            )}
          >
            {chip.value && (
              <span aria-hidden="true" className={cx('size-2 rounded-full', STATUS_DOTS[chip.value], selected && 'ring-2 ring-on-primary/70')} />
            )}
            {chip.label}
            <span
              className={cx(
                'min-w-6 rounded-full px-1.5 text-center text-xs tabular-nums',
                selected ? 'bg-on-primary/20' : 'bg-neutral-soft text-muted',
              )}
            >
              {count ?? '…'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
