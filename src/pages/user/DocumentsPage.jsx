import { FileText } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { getDocuments } from '../../api/documents'
import { DocumentRow } from '../../components/documents/DocumentRow'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { FilterChips } from '../../components/ui/FilterChips'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { groupByMonth } from '../../lib/documents'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'

function fetchDocuments(signal) {
  return getDocuments({ signal })
}

// Documents des réservations de mes organisations (délibérations…) et mes justificatifs.
// Liste non paginée, groupée par mois ; filtre par type en pastilles avec compteur, dans l'URL (?type=deliberation),
// limité aux types présents.
export function DocumentsPage() {
  const documents = useApi(fetchDocuments)
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('type') ?? ''

  function setType(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('type', value)
    else next.delete('type')
    setSearchParams(next, { replace: true })
  }

  const all = documents.data ?? []
  const types = [...new Set(all.map((doc) => doc.document_type))]
  const visible = type ? all.filter((doc) => doc.document_type === type) : all
  const chips = [
    { value: null, label: 'Tous', count: documents.data ? all.length : null },
    ...types.map((value) => ({
      value,
      label: DOCUMENT_TYPE_LABELS[value] ?? value,
      count: all.filter((doc) => doc.document_type === value).length,
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

      {all.length > 0 && <FilterChips label="Type de document" chips={chips} value={type || null} onChange={(value) => setType(value ?? '')} />}

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
          </div>
        )}
      </section>
    </div>
  )
}
