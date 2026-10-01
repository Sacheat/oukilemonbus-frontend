import { useEffect, useState } from 'react'

// Vrai tant que la requête média correspond (ex. '(min-width: 1024px)'), mis à jour au redimensionnement
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const handleChange = () => setMatches(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [query])
  return matches
}
