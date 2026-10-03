import { useState } from 'react'
import { deactivateUser } from '../../api/users'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant de désactiver un compte
export function DeactivateUserModal({ user, open, onClose, onDeactivated }) {
  return (
    <Modal open={open} onClose={onClose} title="Désactiver le compte">
      {open && <DeactivateForm user={user} onClose={onClose} onDeactivated={onDeactivated} />}
    </Modal>
  )
}

function DeactivateForm({ user, onClose, onDeactivated }) {
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState(null)

  async function handleDeactivate() {
    setDeactivating(true)
    setError(null)
    try {
      onDeactivated(await deactivateUser(user.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setDeactivating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <strong>{user.full_name}</strong> ne pourra plus se connecter et ses accès API sont révoqués. Ses réservations
        et son historique sont conservés, et vous pourrez réactiver le compte à tout moment.
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
