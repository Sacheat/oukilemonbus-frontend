import { FileText } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { getDocuments } from '../../api/documents'
import { DocumentRow } from '../../components/documents/DocumentRow'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Select } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'

function fetchDocuments(signal) {
  return getDocuments({ signal })
}

// Documents des réservations de mes organisations (délibérations…) et mes justificatifs.
// Liste non paginée ; filtre par type dans l'URL (?type=deliberation), limité aux types présents.
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

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Mon espace"
        title="Documents"
        description="Délibérations du Collège et autres documents liés à vos réservations, et vos justificatifs."
        className="pb-5"
      />

      {types.length > 1 && (
        <label className="text-xs font-bold text-muted">
          Type de document
          <Select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 min-h-11 max-w-xs py-2 text-sm">
            <option value="">Tous les documents</option>
            {types.map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_TYPE_LABELS[value] ?? value}
              </option>
            ))}
          </Select>
        </label>
      )}

      <section aria-label="Liste des documents" aria-busy={documents.loading} className="mt-6">
        {documents.error ? (
          <ErrorState error={documents.error} onRetry={documents.reload} />
        ) : !documents.data ? (
          <Loader />
        ) : visible.length === 0 ? (
          <EmptyState icon={FileText} title="Aucun document">
            {type
              ? 'Aucun document de ce type.'
              : 'Les délibérations et autres documents de vos réservations apparaîtront ici.'}
          </EmptyState>
        ) : (
          <>
            <p className="mb-2 text-sm text-muted">
              {visible.length} document{visible.length > 1 ? 's' : ''}
            </p>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {visible.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
