// Liste libellé / valeur des pages de détail ; les entrées falsy sont ignorées.
// Libellé et valeur côte à côte si la carte est assez large (requête de conteneur), sinon l'un sous l'autre.
export function DetailList({ items }) {
  return (
    <div className="@container mt-4">
      <dl className="grid gap-x-4 gap-y-2.5 text-sm @xs:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
        {items.filter(Boolean).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="font-semibold break-words @max-xs:mb-1">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
