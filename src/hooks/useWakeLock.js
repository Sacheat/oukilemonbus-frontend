import { useEffect, useState } from 'react'

// Garde l'écran allumé tant que `enabled` est vrai et la page visible (téléphone sur un support dans le bus).
// Le navigateur relâche le verrou quand l'onglet est caché : on le redemande au retour sur la page.
// `supported` : false si le navigateur ne le permet pas (ou hors HTTPS / localhost).
export function useWakeLock(enabled) {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !supported) return undefined
    let sentinel = null
    let cancelled = false

    async function request() {
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release()
          return
        }
        setActive(true)
        sentinel.addEventListener('release', () => setActive(false))
      } catch {
        setActive(false)
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') request()
    }

    request()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      sentinel?.release()
      setActive(false)
    }
  }, [enabled, supported])

  return { supported, active: enabled && active }
}
