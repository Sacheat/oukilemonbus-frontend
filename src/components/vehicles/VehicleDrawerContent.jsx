import { getErrorMessage } from '../../lib/errors'
import { NEW_VEHICLE } from '../../lib/vehicles'
import { Alert } from '../ui/Alert'
import { Loader } from '../ui/Loader'
import { VehicleForm } from './VehicleForm'
import { VehicleStatusControl } from './VehicleStatusControl'

// Contenu du panneau latéral selon ?vehicule= :
// ajout, modification + mise en service, chargement ou véhicule introuvable.
// `opened` : { item, loading, error } de useOpenedItem (page affichée, sinon GET /vehicles/{id})
export function VehicleDrawerContent({ vehicleParam, opened, canCreate, onSaved, onStatusChanged }) {
  if (vehicleParam === NEW_VEHICLE) {
    if (!canCreate) return <Alert tone="danger">Vous n'avez pas le droit d'ajouter un véhicule.</Alert>
    return <VehicleForm key={NEW_VEHICLE} onSaved={onSaved} />
  }

  if (opened.loading) return <Loader />

  const openedVehicle = opened.item
  if (!openedVehicle) {
    if (opened.error && opened.error.response?.status !== 404) {
      return <Alert tone="danger">{getErrorMessage(opened.error)}</Alert>
    }
    return <Alert tone="warning">Ce véhicule est introuvable.</Alert>
  }

  return (
    <>
      <VehicleForm key={openedVehicle.id} vehicle={openedVehicle} onSaved={onSaved} />
      <VehicleStatusControl vehicle={openedVehicle} onChanged={onStatusChanged} />
    </>
  )
}
