import { useEffect } from 'react'

const POLL_MS = 60_000

// Appelle `refresh` toutes les 60 s quand l'onglet est visible, et au retour sur l'onglet
// (même rythme que le badge « à traiter » et les notifications). `refresh` doit être stable.
export function useAutoRefresh(refresh) {
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])
}
