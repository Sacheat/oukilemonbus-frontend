import { NEW_VEHICLE, findVehicle } from '../../lib/vehicles'
import { Alert } from '../ui/Alert'
import { Loader } from '../ui/Loader'
import { VehicleForm } from './VehicleForm'
import { VehicleStatusControl } from './VehicleStatusControl'

// Contenu du panneau latéral selon ?vehicule= :
// ajout, modification + mise en service, chargement ou véhicule introuvable
export function VehicleDrawerContent({ vehicleParam, vehicleList, canCreate, onSaved, onStatusChanged }) {
  if (vehicleParam === NEW_VEHICLE) {
    if (!canCreate) return <Alert tone="danger">Vous n'avez pas le droit d'ajouter un véhicule.</Alert>
    return <VehicleForm key={NEW_VEHICLE} onSaved={onSaved} />
  }

  if (!vehicleList) return <Loader />

  const openedVehicle = findVehicle(vehicleList, vehicleParam)
  if (!openedVehicle) return <Alert tone="warning">Ce véhicule est introuvable sur cette page de la liste.</Alert>

  return (
    <>
      <VehicleForm key={openedVehicle.id} vehicle={openedVehicle} onSaved={onSaved} />
      <VehicleStatusControl vehicle={openedVehicle} onChanged={onStatusChanged} />
    </>
  )
}
