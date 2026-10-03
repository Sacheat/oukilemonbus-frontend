import { api } from './client'

// Traitement des demandes par un agent (espace gestion). `kind` : 'adhesion' (GET /user-org-requests, identifiant
// `request_id`) ou 'creation' (GET /org-registration-requests, identifiant `id`).
// Listes paginées ; filtres : statuses[] (en_attente, approuve, refuse), q, sort (confiance | anciennete |
// recentes), per_page, et organization_id (adhésions) ou organization_type (créations).
const PATHS = {
  adhesion: '/user-org-requests',
  creation: '/org-registration-requests',
}

export async function getRequests(kind, params, { signal } = {}) {
  const { data } = await api.get(PATHS[kind], { params, signal })
  return data
}

export async function getRequest(kind, requestId, { signal } = {}) {
  const { data } = await api.get(`${PATHS[kind]}/${requestId}`, { signal })
  return data.data
}

// Adhésion : ajoute la personne à l'organisation avec le rôle demandé (renvoie la demande) ;
// création : crée l'organisation, le demandeur en devient responsable (renvoie l'organisation, 201).
// Une demande déjà traitée : 422.
export async function approveRequest(kind, requestId) {
  const { data } = await api.patch(`${PATHS[kind]}/${requestId}/approve`)
  return data.data
}

// Refus avec motif obligatoire (2000 caractères au plus) → la demande
export async function rejectRequest(kind, requestId, reason) {
  const { data } = await api.patch(`${PATHS[kind]}/${requestId}/reject`, { rejection_reason: reason })
  return data.data
}
