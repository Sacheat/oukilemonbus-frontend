import { cx } from '../../lib/cx'

// Chiffres clés en tuiles (icône, libellé, valeur, détail facultatif) : détail d'un déplacement,
// trajet vérifié de l'assistant. `facts` : [{ icon, label, value, detail }] ; `className` : la grille.
export function FactTiles({ facts, className }) {
  return (
    <dl className={cx('grid gap-3.5', className ?? 'grid-cols-2 lg:grid-cols-4')}>
      {facts.map(({ icon: Icon, label, value, detail }) => (
        <div key={label} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 shadow-soft sm:gap-3.5 sm:p-4">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-soft text-link sm:size-11">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <dt className="text-sm break-words hyphens-auto text-muted">{label}</dt>
            <dd className="text-lg leading-tight font-bold">{value}</dd>
            {detail && <dd className="text-xs text-muted">{detail}</dd>}
          </div>
        </div>
      ))}
    </dl>
  )
}
