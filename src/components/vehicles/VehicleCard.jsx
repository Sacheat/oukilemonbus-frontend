import { formatVehicleCapacity } from '../../lib/vehicles'
import { FleetDayStatus } from '../fleet/FleetDayStatus'
import { Badge } from '../ui/Badge'

// Carte d'un véhicule : le haut, cliquable, ouvre le panneau de modification ; dessous, l'état du jour
// (`dayState` : fleetDayState, absent pour un véhicule retiré du service) et le lien vers le Planning du jour.
export function VehicleCard({ vehicle, onOpen, dayState, planningHref }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <button type="button" onClick={() => onOpen(vehicle)} className="w-full p-5.5 text-left transition hover:bg-surface-muted">
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span className="text-xl font-bold">{vehicle.licence_plate}</span>
          {vehicle.is_active ? <Badge tone="success">En service</Badge> : <Badge tone="neutral">Retiré du service</Badge>}
        </span>
        <span className="mt-1 block text-sm text-muted">{formatVehicleCapacity(vehicle)}</span>
      </button>
      {vehicle.is_active && <FleetDayStatus state={dayState} planningHref={planningHref} />}
    </div>
  )
}
