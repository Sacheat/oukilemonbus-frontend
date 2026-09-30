import { Clock, Route, Timer, Users } from 'lucide-react'
import { formatLocalRange } from '../../lib/dates'
import { totalPassengers } from '../../lib/reservations'

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

  return (
    <dl className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {facts.map(({ icon: Icon, label, value, detail }) => (
        <div key={label} className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-soft">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-link">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-lg leading-tight font-bold">{value}</dd>
            {detail && <dd className="text-xs text-muted">{detail}</dd>}
          </div>
        </div>
      ))}
    </dl>
  )
}
