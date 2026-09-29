import { getVehicles } from '../../api/vehicles'
import { Alert } from '../../components/ui/Alert'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { getErrorMessage } from '../../lib/errors'

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
        <ul>
          {vehicleList.map((vehicle) => (
            <li key={vehicle.id}>
              {vehicle.licence_plate} — {vehicle.capacity} places
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function fetchVehicles(signal) {
  return getVehicles({}, { signal })
}
