// Liste libellé / valeur des pages de détail ; les entrées falsy sont ignorées
export function DetailList({ items }) {
  return (
    <dl className="mt-4 grid gap-x-4 gap-y-2.5 text-sm sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="font-semibold break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
