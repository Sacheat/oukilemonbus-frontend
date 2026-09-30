import { useState } from 'react'
import { deactivateDriver } from '../../api/drivers'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant de désactiver un chauffeur
export function DeactivateDriverModal({ driver, open, onClose, onDeactivated }) {
  return (
    <Modal open={open} onClose={onClose} title="Désactiver le chauffeur">
      {open && <DeactivateForm driver={driver} onClose={onClose} onDeactivated={onDeactivated} />}
    </Modal>
  )
}

function DeactivateForm({ driver, onClose, onDeactivated }) {
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState(null)

  async function handleDeactivate() {
    setDeactivating(true)
    setError(null)
    try {
      onDeactivated(await deactivateDriver(driver.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setDeactivating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <strong>{driver.user?.full_name ?? 'Ce chauffeur'}</strong> ne sera plus proposé pour les affectations. Vous
        pourrez le réactiver à tout moment.
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleDeactivate} loading={deactivating}>
          Désactiver
        </Button>
      </div>
    </div>
  )
}
