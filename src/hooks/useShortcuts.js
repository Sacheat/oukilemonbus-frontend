import { useEffect, useRef } from 'react'
import { eventKey, SHORTCUT_ACTIONS } from '../lib/shortcuts'

// Écoute le clavier et déclenche `handlers[action]` selon les touches réglées (`keys` : { action: touche }).
// Ignoré pendant la saisie (champ, zone de texte, liste), avec Ctrl / Cmd / Alt, et quand une fenêtre
// modale est ouverte (elle gère ses propres touches). `enabled` : false pour tout couper.
export function useShortcuts(keys, handlers, enabled = true) {
  // Dernières valeurs lues à chaque touche, sans réinscrire l'écouteur à chaque rendu
  const latest = useRef({ keys, handlers })
  useEffect(() => {
    latest.current = { keys, handlers }
  })

  useEffect(() => {
    if (!enabled) return undefined
    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return
      const target = event.target
      if (target.closest?.('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('dialog[open]')) return
      const key = eventKey(event)
      const { keys: current, handlers: callbacks } = latest.current
      const action = SHORTCUT_ACTIONS.find((item) => current[item.id] === key || item.extra === key)
      if (!action || !callbacks[action.id]) return
      event.preventDefault()
      callbacks[action.id]()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}
