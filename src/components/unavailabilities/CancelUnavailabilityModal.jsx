import { useState } from 'react'
import { cancelUnavailability } from '../../api/unavailabilities'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant d'annuler une indisponibilité (elle reste visible dans l'onglet « Annulées »)
export function CancelUnavailabilityModal({ unavailability, subject, open, onClose, onCancelled }) {
  return (
    <Modal open={open} onClose={onClose} title="Annuler l'indisponibilité">
      {open && <CancelForm unavailability={unavailability} subject={subject} onClose={onClose} onCancelled={onCancelled} />}
    </Modal>
  )
}

function CancelForm({ unavailability, subject, onClose, onCancelled }) {
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState(null)

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      onCancelled(await cancelUnavailability(unavailability.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setCancelling(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <strong>{subject}</strong> redeviendra disponible sur cette période. L'indisponibilité reste visible dans
        l'onglet « Annulées ». Pensez à vérifier les réservations qui étaient passées en conflit.
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleCancel} loading={cancelling}>
          Annuler l'indisponibilité
        </Button>
      </div>
    </div>
  )
}
