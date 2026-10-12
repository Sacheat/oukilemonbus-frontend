import { FileText } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { DocumentRow } from '../../components/documents/DocumentRow'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { FilterChips } from '../../components/ui/FilterChips'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { useDocumentCounts, useDocuments } from '../../hooks/useDocuments'
import { groupByMonth, readUserDocumentsSearch, USER_DOCUMENT_TYPES } from '../../lib/documents'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'

// Paramètres sans filtre pour les compteurs des pastilles
const COUNT_KEY = JSON.stringify({})

// Documents des réservations de mes organisations (délibérations…) et mes justificatifs.
// Liste paginée par le backend (15 par page), groupée par mois ; filtre par type en pastilles avec compteur
// (meta.total d'un appel par type), dans l'URL (?type=deliberation&page=2) ; pastilles sans document masquées.
export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { type, page } = readUserDocumentsSearch(searchParams)
  const documents = useDocuments(JSON.stringify({ page, ...(type && { document_type: [type] }) }))
  const counts = useDocumentCounts(COUNT_KEY, USER_DOCUMENT_TYPES)

  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    setSearchParams(next, { replace: true })
  }

  const visible = documents.data?.data ?? []
  const totals = counts.data
  const chips = [
    { value: null, label: 'Tous', count: totals ? totals.all : null },
    ...USER_DOCUMENT_TYPES.filter((value) => value === type || (totals && totals[value] > 0)).map((value) => ({
      value,
      label: DOCUMENT_TYPE_LABELS[value] ?? value,
      count: totals ? totals[value] : null,
    })),
  ]

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Mon espace"
        title="Documents"
        description="Délibérations du Collège et autres documents liés à vos réservations, et vos justificatifs."
        className="pb-5"
      />

      {(type || totals?.all > 0) && (
        <FilterChips label="Type de document" chips={chips} value={type} onChange={(value) => updateSearch({ type: value, page: null })} />
      )}

      <section aria-label="Liste des documents" aria-busy={documents.loading} className="mt-6">
        {documents.error ? (
          <ErrorState error={documents.error} onRetry={documents.reload} />
        ) : !documents.data ? (
          <div role="status" className="grid gap-3">
            <span className="sr-only">Chargement des documents…</span>
            <Skeleton className="h-4 w-28" />
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24 rounded-card" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={FileText} title="Aucun document">
            {type
              ? 'Aucun document de ce type.'
              : 'Les délibérations et autres documents de vos réservations apparaîtront ici.'}
          </EmptyState>
        ) : (
          <div className="grid gap-6">
            {groupByMonth(visible).map((group) => (
              <section key={group.key} aria-labelledby={`mois-${group.key}`}>
                <h2 id={`mois-${group.key}`} className="mb-2.5 text-sm font-extrabold tracking-[.1em] text-muted uppercase">
                  {group.label} <span className="font-semibold tracking-normal normal-case">· {group.items.length}</span>
                </h2>
                <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
                  {group.items.map((doc) => (
                    <DocumentRow key={doc.id} document={doc} />
                  ))}
                </ul>
              </section>
            ))}
            <Pagination meta={documents.data.meta} onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })} />
          </div>
        )}
      </section>
    </div>
  )
}
