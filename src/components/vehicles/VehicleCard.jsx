import { formatVehicleCapacity } from '../../lib/vehicles'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

// Carte d'un véhicule, cliquable en entier pour ouvrir le panneau de modification
export function VehicleCard({ vehicle, onOpen }) {
  return (
    <Card
      as="button"
      type="button"
      onClick={() => onOpen(vehicle)}
      className="w-full text-left transition hover:border-line-strong hover:bg-surface-muted"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xl font-bold">{vehicle.licence_plate}</p>
        {vehicle.is_active ? <Badge tone="success">En service</Badge> : <Badge tone="neutral">Retiré du service</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">{formatVehicleCapacity(vehicle)}</p>
    </Card>
  )
}
