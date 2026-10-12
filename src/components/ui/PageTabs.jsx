import { cx } from '../../lib/cx'
import { Select } from './Field'

// Onglets d'une page (?onglet=). `options` : [{ value, label, count?, alert?, countLabel? }] (count : nombre affiché s'il n'est pas
// null ; alert : nombre en rouge, ex. jobs en échec ; countLabel : ce qu'il compte, pour les lecteurs d'écran) ; `label` : nom du groupe pour l'accessibilité.
// Petit écran : une liste déroulante qui dit toujours l'onglet affiché ; à partir de 640 px : des segments.
export function PageTabs({ label, options, value, onChange }) {
  return (
    <>
      <Select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="py-2 text-sm font-semibold sm:hidden">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count != null ? ` (${option.count})` : ''}
          </option>
        ))}
      </Select>
      <div role="group" aria-label={label} className="hidden w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1 sm:flex">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cx(
                'inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap',
                selected ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
              {option.count != null && (
                <span
                  className={cx(
                    'inline-block min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums',
                    selected ? 'bg-on-primary/20' : option.alert ? 'bg-danger-soft text-danger' : 'bg-neutral-soft text-muted',
                  )}
                >
                  {option.count}
                  {option.countLabel && <span className="sr-only"> {option.countLabel}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
