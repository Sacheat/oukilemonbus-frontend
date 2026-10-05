import { useCallback } from 'react'
import { getDocument } from '../../api/documents'
import { useApi } from '../../hooks/useApi'
import { DocumentRow } from '../documents/DocumentRow'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'

// Justificatif d'une demande (Ouvrir, Télécharger), chargé par son identifiant de document
export function ProofDocument({ documentId }) {
  const fetchDocument = useCallback((signal) => getDocument(documentId, { signal }), [documentId])
  const proof = useApi(fetchDocument)
  if (proof.error) return <ErrorState error={proof.error} onRetry={proof.reload} />
  if (!proof.data) return <Loader />
  return <DocumentRow document={proof.data} showReservation={false} />
}
