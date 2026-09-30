import { formatDateTime } from './dates'
import { RELATIONSHIP_TYPE_LABELS } from './labels'

// Rôles qu'on peut demander en rejoignant une organisation (« membre » n'est pas proposé par le backend)
export const REQUESTABLE_ROLES = ['prof', 'directeur', 'animateur', 'responsable', 'referent'].map((value) => ({
  value,
  label: RELATIONSHIP_TYPE_LABELS[value],
}))

// Relations qu'un responsable peut attribuer à un membre ; responsable et directeur gèrent l'organisation
export const MEMBER_ROLES = Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => ({ value, label }))
export const MANAGER_ROLES = ['responsable', 'directeur']

// Demandes d'adhésion en attente adressées à une organisation (hors les miennes)
export function pendingJoinRequestsFor(organizationId, userId, joinRequests = []) {
  return joinRequests.filter(
    (request) =>
      request.organization_id === organizationId && request.status === 'en_attente' && request.requested_by_user_id !== userId,
  )
}

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

// Initiales d'une organisation pour sa pastille : « Ecole communale de Dinant » → « EC »,
// « ASBL Dinant Solidaire » → « AD » (les petits mots de liaison sont ignorés)
const LINK_WORDS = ['de', 'du', 'des', 'la', 'le', 'les', 'et', 'l', 'd', 'à', 'au', 'aux']

export function organizationInitials(name = '') {
  return name
    .split(/[\s'’-]+/)
    .filter((word) => !LINK_WORDS.includes(word.toLowerCase()))
    .map((word) => word.match(/\p{L}|\d/u)?.[0]) // première lettre (« [TEST » → « T »)
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Suivi d'une demande (adhésion ou création) en trois étapes pour ProgressSteps :
// envoyée, examen par la commune, décision (acceptée ou refusée)
export function requestSteps(request) {
  const decided = request.status !== 'en_attente'
  const reviewed = request.reviewed_at ? formatDateTime(request.reviewed_at).slice(0, 10) : null
  return [
    { key: 'sent', label: 'Envoyée', detail: formatDateTime(request.created_at).slice(0, 10), state: 'done' },
    { key: 'review', label: 'Examen', detail: decided ? null : 'en cours', state: decided ? 'done' : 'current' },
    request.status === 'refuse'
      ? { key: 'decision', label: 'Refusée', detail: reviewed, state: 'stopped' }
      : request.status === 'approuve'
        ? { key: 'decision', label: 'Acceptée', detail: reviewed, state: 'done' }
        : { key: 'decision', label: 'Décision', detail: null, state: 'upcoming' },
  ]
}
