import { api } from './client'

// Documents visibles (non paginé, plus récents d'abord) : ceux des réservations de mes organisations
// et mes justificatifs. Chaque document inclut sa réservation (`reservation`) quand il y en a une.
export async function getDocuments({ signal } = {}) {
  const { data } = await api.get('/documents', { signal })
  return data.data
}

// Un document (nom de fichier, type, taille…), sans son contenu
export async function getDocument(documentId, { signal } = {}) {
  const { data } = await api.get(`/documents/${documentId}`, { signal })
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

// Décision du Collège d'une réservation (une seule par réservation), ou null
export async function getReservationDecision(reservationId, { signal } = {}) {
  const page = await getCouncilDecisions({ reservation_id: reservationId }, { signal })
  return page.data.find((decision) => decision.reservation_id === reservationId) ?? null
}
