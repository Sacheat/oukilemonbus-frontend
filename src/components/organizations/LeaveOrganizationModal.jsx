import { useState } from 'react'
import { leaveOrganization } from '../../api/organizations'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant de quitter une organisation. Le backend refuse le départ du dernier responsable (422).
export function LeaveOrganizationModal({ organization, open, onClose, onLeft }) {
  return (
    <Modal open={open} onClose={onClose} title="Quitter l’organisation">
      {open && organization && <LeaveForm organization={organization} onClose={onClose} onLeft={onLeft} />}
    </Modal>
  )
}

function LeaveForm({ organization, onClose, onLeft }) {
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleLeave() {
    setLeaving(true)
    setError(null)
    try {
      await leaveOrganization(organization.id)
      await onLeft(organization)
    } catch (err) {
      setError(getErrorMessage(err))
      setLeaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        Vous ne pourrez plus réserver au nom de <strong>{organization.name}</strong> ni voir ses réservations. Pour y revenir, il
        faudra refaire une demande d’adhésion.
      </p>
      {organization.membership.is_default && (
        <p className="text-sm text-muted">C’est votre organisation par défaut : la plus ancienne des autres la remplacera.</p>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleLeave} loading={leaving}>
          Quitter l’organisation
        </Button>
      </div>
    </div>
  )
}
