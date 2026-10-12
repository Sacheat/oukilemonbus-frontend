import { api } from './client'

// Page de documents visibles par le compte, plus récents d'abord (toujours paginé, 15 par défaut, `per_page` 100 au
// plus), enveloppe { data, meta } : filtres `document_type[]`, `date_from`, `date_to`, `q`, `reservation_id`
// (documents de la réservation, et feuilles de route qui la contiennent), `page`, `per_page`.
// Usager : documents des réservations de ses organisations et ses justificatifs ; chacun inclut sa réservation.
export async function getDocumentsPage(params = {}, { signal } = {}) {
  const { data } = await api.get('/documents', { params, signal })
  return data
}

// Un document (nom de fichier, type, taille…), sans son contenu
export async function getDocument(documentId, { signal } = {}) {
  const { data } = await api.get(`/documents/${documentId}`, { signal })
  return data.data
}

// Fichier (PDF ou image) en Blob, avec la session
export async function downloadDocument(documentId, { signal } = {}) {
  const { data } = await api.get(`/documents/${documentId}/download`, { responseType: 'blob', signal })
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
