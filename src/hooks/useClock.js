import { useEffect, useState } from 'react'

const TICK_MS = 30_000

// Heure actuelle (Date), mise à jour toutes les 30 s : pour un temps écoulé affiché en direct (« il y a 38 min »).
// useNow donne l'heure de Bruxelles en texte, pour comparer à des heures locales ; celui-ci sert aux durées.
export function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}
