import { RELATIONSHIP_TYPE_LABELS } from './labels'

// Rôles qu'on peut demander en rejoignant une organisation (« membre » n'est pas proposé par le backend)
export const REQUESTABLE_ROLES = ['prof', 'directeur', 'animateur', 'responsable', 'referent'].map((value) => ({
  value,
  label: RELATIONSHIP_TYPE_LABELS[value],
}))

// Justificatif : mêmes contraintes que le backend (mimes:pdf,jpg,jpeg,png|max:5120)
export const PROOF_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const PROOF_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const PROOF_MAX_BYTES = 5 * 1024 * 1024

// Message d'erreur si le fichier ne convient pas, sinon null (le backend vérifie aussi)
export function proofFileError(file) {
  if (!file) return null
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!PROOF_EXTENSIONS.includes(extension)) return 'Le justificatif doit être un fichier PDF, JPG ou PNG.'
  if (file.size > PROOF_MAX_BYTES) return 'Le justificatif ne doit pas dépasser 5 Mo.'
  return null
}

export const REQUEST_STATUS_TONES = { en_attente: 'warning', approuve: 'success', refuse: 'danger' }

// Demandes d'adhésion et de création réunies dans une seule liste, les plus récentes d'abord.
// Les demandes d'adhésion reçues par un responsable pour son organisation sont écartées.
export function myRequests(userId, joinRequests = [], creationRequests = []) {
  return [
    ...joinRequests
      .filter((request) => request.requested_by_user_id === userId)
      .map((request) => ({ kind: 'adhesion', id: request.request_id, request })),
    ...creationRequests.map((request) => ({ kind: 'creation', id: request.id, request })),
  ].sort((a, b) => b.request.created_at.localeCompare(a.request.created_at))
}
