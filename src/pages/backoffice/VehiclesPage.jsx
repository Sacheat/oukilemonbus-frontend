import { getVehicles } from '../../api/vehicles'
import { Alert } from '../../components/ui/Alert'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { getErrorMessage } from '../../lib/errors'
import { Card } from '../../components/ui/Card'

// Flotte : liste des véhicules
export function VehiclesPage() {
  const vehicles = useApi(fetchVehicles)
  const vehicleList = vehicles.data?.data   // la liste des véhicules (undefined tant que rien n'est reçu)

  return (
    <div>
      <PageHeader eyebrow="Flotte" title="Véhicules" />

      {vehicles.error ? (
        <Alert tone="danger">{getErrorMessage(vehicles.error)}</Alert>
      ) : !vehicleList ? (
        <Loader />
      ) : vehicleList.length === 0 ? (
        <Alert>Aucun véhicule enregistré.</Alert>
      ) : (
            <div className="grid gap-4 sm:grid-cols-2">
            {vehicleList.map((vehicle) => (
                <Card key={vehicle.id}>
                <p className="text-xl font-bold">{vehicle.licence_plate }</p>
                <p className="text-muted">
                    {vehicle.capacity -1} places · {vehicle.capacity} passagers + chauffeur
                </p>
                <p>{vehicle.is_active ? 'En service' : 'Retiré du service'}</p>
                </Card>
            ))}
            </div>
      )}
    </div>
  )
}

function fetchVehicles(signal) {
  return getVehicles({}, { signal })
}
