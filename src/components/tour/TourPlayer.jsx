import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { isTourSeen, tourCards, visibleSpots } from '../../lib/tours'
import { SpotlightTour } from './SpotlightTour'
import { WelcomeTour } from './WelcomeTour'

// Déroulé d'un tutoriel (chargé à la demande par TourLauncher) : cartes tant que le tutoriel n'est pas vu, marqué vu
// dès qu'on les ferme, qu'on les passe ou qu'on lance la visite, puis la visite si elle a été demandée.
export function TourPlayer({ tour }) {
  const auth = useAuth()
  const { user, markTourSeen } = auth
  const [spotlightSteps, setSpotlightSteps] = useState(null)
  // Élément qui avait le focus avant le tutoriel : la fenêtre des cartes le rend d'elle-même (<dialog>), la visite
  // le rend à sa fermeture s'il est toujours dans la page
  const [returnFocus] = useState(() => document.activeElement)

  const findSpotlightSteps = useCallback(() => visibleSpots(tour, auth), [tour, auth])
  const closeCards = useCallback(() => markTourSeen(tour), [tour, markTourSeen])
  const closeSpotlight = useCallback(() => {
    setSpotlightSteps(null)
    if (returnFocus?.isConnected && returnFocus !== document.body) returnFocus.focus()
  }, [returnFocus])

  if (spotlightSteps) return <SpotlightTour steps={spotlightSteps} onClose={closeSpotlight} />
  if (isTourSeen(user, tour)) return null

  return (
    <WelcomeTour
      cards={tourCards(tour, auth)}
      onClose={closeCards}
      findSpotlightSteps={findSpotlightSteps}
      onSpotlight={(steps) => {
        setSpotlightSteps(steps)
        markTourSeen(tour)
      }}
    />
  )
}
