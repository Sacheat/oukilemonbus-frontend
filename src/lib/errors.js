import axios from 'axios'

const FALLBACK_MESSAGE = 'Une erreur est survenue. Réessayez dans un instant.'

// Message à afficher à l'utilisateur. Le backend renvoie des messages en français
// prêts à afficher ; on n'affiche jamais le reste du corps (traces en mode debug).
export function getErrorMessage(error, fallback = FALLBACK_MESSAGE) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
    const message = error.response.data?.message
    if (typeof message === 'string' && message && error.response.status < 500) return message
  }
  return fallback
}

// Erreurs de validation 422 : { champ: 'message' }. Le backend peut renvoyer plusieurs règles
// pour un même champ (ex. préavis et week-end sur la date) : une ligne par message.
export function getFieldErrors(error) {
  const errors = axios.isAxiosError(error) ? error.response?.data?.errors : null
  if (!errors) return {}
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, [].concat(messages).join('\n')]),
  )
}
