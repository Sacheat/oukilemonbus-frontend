// Brouillons de formulaires dans sessionStorage (onglet courant uniquement).
// Encadrement : liés à l'utilisateur, expirés après 12 h, effacés à la déconnexion
// (voir AuthProvider) et après l'envoi. Jamais de données sensibles (mots de passe, jetons).
const PREFIX = 'oukilemonbus-draft:'
const TTL_MS = 12 * 60 * 60 * 1000

export function loadDraft(name, userId) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(PREFIX + name))
    if (!draft) return null
    if (draft.userId !== userId || Date.now() - draft.savedAt > TTL_MS) {
      sessionStorage.removeItem(PREFIX + name)
      return null
    }
    return draft.data
  } catch {
    return null
  }
}

export function saveDraft(name, userId, data) {
  try {
    sessionStorage.setItem(PREFIX + name, JSON.stringify({ userId, savedAt: Date.now(), data }))
  } catch {
    // Stockage indisponible (navigation privée, quota) : pas de brouillon
  }
}

export function clearDraft(name) {
  try {
    sessionStorage.removeItem(PREFIX + name)
  } catch {
    // ignoré
  }
}

export function clearAllDrafts() {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => sessionStorage.removeItem(key))
  } catch {
    // ignoré
  }
}
