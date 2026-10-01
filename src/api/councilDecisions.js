import { api } from './client'

// La liste (getCouncilDecisions) est dans documents.js. Filtres : reservation_id, decision_status
// (approuve, refuse, en_attente). Chaque décision inclut sa réservation et son organisation.

// Enregistrer la décision du Collège pour une réservation (CPAS, ASBL, externe ; une seule par réservation).
// Approuvée ou refusée : la délibération PDF est générée et le demandeur prévenu ; refusée : la réservation
// est refusée automatiquement (motif = notes, ou « Décision défavorable du collège »).
export async function createCouncilDecision(reservationId, values) {
  const { data } = await api.post('/council-decisions', { reservation_id: reservationId, ...decisionBody(values) })
  return data.data
}

// Modifier une décision : les conséquences sont réappliquées et une nouvelle version du PDF est générée
export async function updateCouncilDecision(decisionId, values) {
  const { data } = await api.patch(`/council-decisions/${decisionId}`, decisionBody(values))
  return data.data
}

// Régénérer la délibération PDF (nouvelle version), permission documents.generate
export async function regenerateDeliberation(decisionId) {
  const { data } = await api.post(`/council-decisions/${decisionId}/generate-document`)
  return data.data
}

function decisionBody(values) {
  return {
    decision_status: values.decision_status || null,
    decision_date: values.decision_date || null,
    decision_reference: values.decision_reference.trim() || null,
    notes: values.notes.trim() || null,
  }
}
