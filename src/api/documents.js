import { api } from './client'

// Documents visibles (non paginé, plus récents d'abord) : ceux des réservations de mes organisations
// et mes justificatifs. Chaque document inclut sa réservation (`reservation`) quand il y en a une.
export async function getDocuments({ signal } = {}) {
  const { data } = await api.get('/documents', { signal })
  return data.data
}

// Fichier (PDF ou image) en Blob, avec la session
export async function downloadDocument(documentId) {
  const { data } = await api.get(`/documents/${documentId}/download`, { responseType: 'blob' })
  return data
}

// Décisions du Collège (liste paginée) ; `reservation_id` pour celle d'une réservation
export async function getCouncilDecisions(params = {}, { signal } = {}) {
  const { data } = await api.get('/council-decisions', { params, signal })
  return data
}
