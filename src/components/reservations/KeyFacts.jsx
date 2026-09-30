import { Clock, Route, Timer, Users } from 'lucide-react'
import { formatLocalRange } from '../../lib/dates'
import { totalPassengers } from '../../lib/reservations'
import { FactTiles } from './FactTiles'

// Chiffres clés d'un déplacement en tuiles : distance, durée du trajet, passagers, créneau du bus
export function KeyFacts({ reservation }) {
  const occupation = reservation.estimated_occupation
  const facts = [
    reservation.distance_km != null && {
      icon: Route,
      label: 'Distance',
      value: `${Number(reservation.distance_km).toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km`,
    },
    reservation.estimated_duration_min != null && { icon: Timer, label: 'Trajet estimé', value: `${reservation.estimated_duration_min} min` },
    {
      icon: Users,
      label: 'Passagers',
      value: totalPassengers(reservation),
      detail: `${reservation.nb_children} enfant${reservation.nb_children > 1 ? 's' : ''}, ${reservation.nb_adults} adulte${reservation.nb_adults > 1 ? 's' : ''}`,
    },
    occupation && { icon: Clock, label: 'Bus réservé', value: formatLocalRange(occupation.start_at, occupation.end_at).replace(/^de /, '') },
  ].filter(Boolean)

  return <FactTiles facts={facts} />
}
