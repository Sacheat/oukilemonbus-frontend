import { useEffect, useState } from 'react'
import { brusselsNow } from '../lib/dates'

const TICK_MS = 30_000

// Heure actuelle à Bruxelles ("AAAA-MM-JJTHH:mm"), mise à jour toutes les 30 s :
// pour les trajets en cours, le prochain départ et le trait « maintenant » de la frise
export function useNow() {
  const [now, setNow] = useState(() => brusselsNow())
  useEffect(() => {
    const timer = setInterval(() => setNow(brusselsNow()), TICK_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}
