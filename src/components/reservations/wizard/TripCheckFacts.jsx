import { CircleCheck, Clock, Flag, Route, Timer } from 'lucide-react'
import { formatLocalRange } from '../../../lib/dates'
import { estimatedArrivals } from '../../../lib/reservations'
import { FactTiles } from '../FactTiles'

// Résultat de la vérification du trajet (check-trip ou preview) en tuiles : distance, durée,
// arrivée estimée (et retour), créneau pendant lequel le bus est bloqué (retour et marges compris)
export function TripCheckFacts({ result, title = 'Trajet vérifié' }) {
  const occupation = result.estimated_occupation
  const arrivals = estimatedArrivals(result)
  const facts = [
    result.distance_km != null && {
      icon: Route,
      label: 'Distance',
      value: `${Number(result.distance_km).toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km`,
    },
    result.estimated_duration_min != null && { icon: Timer, label: 'Trajet estimé', value: `${result.estimated_duration_min} min` },
    arrivals?.outbound && {
      icon: Flag,
      label: 'Arrivée estimée',
      value: `vers ${arrivals.outbound}`,
      detail: arrivals.back && `retour au départ vers ${arrivals.back}`,
    },
    occupation && { icon: Clock, label: 'Bus réservé', value: formatLocalRange(occupation.start_at, occupation.end_at).replace(/^de /, '') },
  ].filter(Boolean)

  return (
    <section aria-label={title} className="grid gap-3">
      <p className="flex items-center gap-2 text-sm font-bold text-success">
        <CircleCheck className="size-4.5" aria-hidden="true" /> {title}
      </p>
      {facts.length > 0 && <FactTiles facts={facts} className="sm:grid-cols-2" />}
    </section>
  )
}
