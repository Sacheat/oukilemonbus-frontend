import { Suspense, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { lazyPage } from '../../lib/lazyPage'

// Textes, icônes et composants du tutoriel téléchargés seulement s'il y en a un à montrer (une fois par compte)
const TourPlayer = lazyPage(() => import('./TourPlayer'), 'TourPlayer')

// Tutoriel de première connexion d'un espace (`tour` : usager, agent, chauffeur), monté par le layout de l'espace.
// Une fois lancé, TourPlayer reste monté : la visite continue après que le tutoriel a été marqué vu.
export function TourLauncher({ tour }) {
  const { user } = useAuth()
  const unseen = !user?.tours_seen?.[tour]
  const [started, setStarted] = useState(unseen)
  if (unseen && !started) setStarted(true)
  if (!started) return null
  return (
    <Suspense fallback={null}>
      <TourPlayer tour={tour} />
    </Suspense>
  )
}
