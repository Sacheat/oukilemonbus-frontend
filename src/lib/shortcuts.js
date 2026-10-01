// Raccourcis clavier de l'espace gestion, configurables. Préférence d'affichage propre au navigateur
// (comme le thème), gardée dans localStorage : pas une donnée métier. Lecture et écriture protégées
// (navigation privée, stockage bloqué) : on retombe alors sur les réglages par défaut.
const STORAGE_KEY = 'oukilemonbus-shortcuts'

// Actions de la file des réservations. Les flèches ↑ / ↓ (et Échap pour fermer) marchent toujours en plus
// des touches choisies.
export const SHORTCUT_ACTIONS = [
  { id: 'next', label: 'Réservation suivante', key: 'j', extra: 'ArrowDown' },
  { id: 'previous', label: 'Réservation précédente', key: 'k', extra: 'ArrowUp' },
  { id: 'approve', label: 'Approuver', key: 'a' },
  { id: 'reject', label: 'Refuser', key: 'r' },
  { id: 'assign', label: 'Affecter un chauffeur ou un véhicule', key: 'e' },
  { id: 'confirm', label: 'Confirmer', key: 'c' },
  { id: 'council', label: 'Décision du Collège', key: 'd' },
  { id: 'help', label: 'Afficher les raccourcis', key: '?' },
  // Touche fixe (non modifiable) : pas de `key`, seulement `extra`
  { id: 'close', label: 'Fermer le détail', key: null, extra: 'Escape' },
]

export const DEFAULT_SETTINGS = {
  keys: Object.fromEntries(SHORTCUT_ACTIONS.map((action) => [action.id, action.key])),
  autoNext: true, // après une action, passer à la réservation suivante
}

export function loadShortcutSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return DEFAULT_SETTINGS
    return { keys: { ...DEFAULT_SETTINGS.keys, ...saved.keys }, autoNext: saved.autoNext ?? DEFAULT_SETTINGS.autoNext }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveShortcutSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Stockage indisponible : les réglages valent pour cette visite seulement
  }
}

// Touche d'un événement clavier, comparable aux réglages (« a », « ? », « ArrowDown »)
export function eventKey(event) {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key
}

// Libellé lisible d'une touche : « A », « ? », « ↓ »
const KEY_LABELS = { ArrowDown: '↓', ArrowUp: '↑', ArrowLeft: '←', ArrowRight: '→', ' ': 'Espace', Enter: 'Entrée', Escape: 'Échap' }
export function keyLabel(key) {
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key)
}

// Touches qu'on ne peut pas attribuer (déjà utilisées par le navigateur ou l'interface)
export const RESERVED_KEYS = ['Escape', 'Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']
