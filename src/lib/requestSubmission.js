import { uploadRequestProof } from '../api/organizations'
import { getErrorMessage, getFieldErrors } from './errors'

// Après la création d'une demande : envoie le justificatif s'il y en a un et construit le message
// affiché sur « Mes organisations ». La demande existe même si l'envoi du fichier échoue.
export async function sendProofAndNotice(kind, requestId, file, successMessage) {
  if (!file) return { tone: 'success', message: successMessage }
  try {
    await uploadRequestProof(kind, requestId, file)
    return { tone: 'success', message: successMessage }
  } catch (error) {
    const reason = getFieldErrors(error).proof_document ?? getErrorMessage(error)
    return {
      tone: 'warning',
      message: `${successMessage} Le justificatif n’a pas pu être joint (${reason}) : vous pouvez l’ajouter depuis « Mes demandes ».`,
    }
  }
}
