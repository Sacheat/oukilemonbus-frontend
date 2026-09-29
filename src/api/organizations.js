import { api } from './client'

// ----- Mes organisations (la liste vient de /auth/me : organizations[].membership) -----

export async function leaveOrganization(organizationId) {
  await api.post(`/organizations/${organizationId}/leave`)
}

// Renvoie l'utilisateur à jour (même forme que /auth/me)
export async function makeDefaultOrganization(organizationId) {
  const { data } = await api.patch(`/organizations/${organizationId}/default`)
  return data.data
}

// ----- Demandes d'adhésion (identifiant : request_id) -----

// Organisations que je peux encore demander à rejoindre (non paginé)
export async function getAvailableOrganizations({ signal } = {}) {
  const { data } = await api.get('/user-org-requests/available-organizations', { signal })
  return data.data
}

// Liste paginée : mes demandes et celles adressées aux organisations que je gère
export async function getUserOrgRequests(params = {}, { signal } = {}) {
  const { data } = await api.get('/user-org-requests', { params, signal })
  return data
}

export async function createUserOrgRequest({ organization_id, requested_role, justification }) {
  const { data } = await api.post('/user-org-requests', {
    organization_id: organization_id ? Number(organization_id) : null,
    requested_role,
    justification: justification.trim() || null,
  })
  return data.data
}

// ----- Demandes de création d'organisation -----

// Liste paginée de mes demandes
export async function getOrgRegistrationRequests(params = {}, { signal } = {}) {
  const { data } = await api.get('/org-registration-requests', { params, signal })
  return data
}

// `values.location_id` : objet Location choisi (ou null), nommé comme le champ du backend
// pour que ses erreurs 422 arrivent sous le bon champ
export async function createOrgRegistrationRequest(values) {
  const { data } = await api.post('/org-registration-requests', {
    organization_name: values.organization_name.trim(),
    organization_type: values.organization_type,
    enterprise_number: values.enterprise_number.trim() || null,
    official_email: values.official_email.trim(),
    phone: values.phone.trim() || null,
    location_id: values.location_id?.id ?? null,
    contact_person_name: values.contact_person_name.trim() || null,
    contact_person_role: values.contact_person_role.trim() || null,
    comment: values.comment.trim() || null,
  })
  return data.data
}

// ----- Justificatifs (multipart, champ proof_document : PDF, JPG ou PNG, 5 Mo max) -----

const PROOF_PATHS = {
  adhesion: (id) => `/user-org-requests/${id}/proof`,
  creation: (id) => `/org-registration-requests/${id}/proof`,
}

// `kind` : 'adhesion' ou 'creation'. Remplace le justificatif précédent ; renvoie le Document créé.
export async function uploadRequestProof(kind, requestId, file) {
  const body = new FormData()
  body.append('proof_document', file)
  const { data } = await api.post(PROOF_PATHS[kind](requestId), body)
  return data.data
}

export async function deleteRequestProof(kind, requestId) {
  await api.delete(PROOF_PATHS[kind](requestId))
}
