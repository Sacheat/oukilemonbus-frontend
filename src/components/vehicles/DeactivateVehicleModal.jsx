import { useState } from 'react'
import { deactivateVehicle } from '../../api/vehicles'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant de retirer un véhicule du service
export function DeactivateVehicleModal({ vehicle, open, onClose, onDeactivated }) {
  return (
    <Modal open={open} onClose={onClose} title="Retirer du service">
      {open && <DeactivateForm vehicle={vehicle} onClose={onClose} onDeactivated={onDeactivated} />}
    </Modal>
  )
}

function DeactivateForm({ vehicle, onClose, onDeactivated }) {
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState(null)

  async function handleDeactivate() {
    setDeactivating(true)
    setError(null)
    try {
      onDeactivated(await deactivateVehicle(vehicle.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setDeactivating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        Le véhicule <strong>{vehicle.licence_plate}</strong> ne sera plus proposé pour les affectations. Vous pourrez le
        remettre en service à tout moment.
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleDeactivate} loading={deactivating}>
          Retirer du service
        </Button>
      </div>
    </div>
  )
}
