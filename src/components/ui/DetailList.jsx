import { cx } from '../../lib/cx'

// Largeur de carte à partir de laquelle libellé et valeur sont côte à côte (requête de conteneur) :
// xs (20rem) par défaut ; sm (24rem) pour des valeurs longues (adresses) lues sur téléphone
const LAYOUTS = {
  xs: { list: '@xs:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]', value: '@max-xs:mb-1' },
  sm: { list: '@sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]', value: '@max-sm:mb-1' },
}

// Liste libellé / valeur des pages de détail ; les entrées falsy sont ignorées.
// Libellé et valeur côte à côte si la carte est assez large (`sideBySideFrom`), sinon l'un sous l'autre.
export function DetailList({ items, sideBySideFrom = 'xs' }) {
  const layout = LAYOUTS[sideBySideFrom]
  return (
    <div className="@container mt-4">
      <dl className={cx('grid gap-x-4 gap-y-2.5 text-sm', layout.list)}>
        {items.filter(Boolean).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className={cx('font-semibold break-words', layout.value)}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
