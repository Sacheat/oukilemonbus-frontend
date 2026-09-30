import { useState } from 'react'
import { removeMember } from '../../api/organizations'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant de retirer un membre. Le backend refuse de retirer le dernier responsable (422).
export function RemoveMemberModal({ organization, member, open, onClose, onRemoved }) {
  return (
    <Modal open={open} onClose={onClose} title="Retirer un membre">
      {open && member && <RemoveForm organization={organization} member={member} onClose={onClose} onRemoved={onRemoved} />}
    </Modal>
  )
}

function RemoveForm({ organization, member, onClose, onRemoved }) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)

  async function handleRemove() {
    setRemoving(true)
    setError(null)
    try {
      await removeMember(organization.id, member.user_id)
      onRemoved(member)
    } catch (err) {
      setError(getFieldErrors(err).user ?? getErrorMessage(err))
      setRemoving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <strong>{member.full_name}</strong> ne fera plus partie de l’organisation « {organization.name} » : cette personne ne pourra
        plus réserver au nom de l’organisation ni voir ses réservations. Pour revenir, elle devra refaire une demande d’adhésion.
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleRemove} loading={removing}>
          Retirer de l’organisation
        </Button>
      </div>
    </div>
  )
}
