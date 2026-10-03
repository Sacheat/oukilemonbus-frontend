import { useState } from 'react'
import { updateMunicipality } from '../../api/municipalities'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant d'activer une commune : ses règles remplacent celles de la commune active pour toute la plateforme
export function ActivateMunicipalityModal({ municipality, current, onClose, onActivated }) {
  return (
    <Modal open={Boolean(municipality)} onClose={onClose} title="Activer une commune">
      {municipality && <ActivateForm municipality={municipality} current={current} onClose={onClose} onActivated={onActivated} />}
    </Modal>
  )
}

function ActivateForm({ municipality, current, onClose, onActivated }) {
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState(null)

  async function handleActivate() {
    setActivating(true)
    setError(null)
    try {
      onActivated(await updateMunicipality(municipality.id, { is_active: true }))
    } catch (err) {
      setError(getErrorMessage(err))
      setActivating(false)
    }
  }

  return (
    <div className="grid gap-4 text-sm">
      <p>
        <strong>{municipality.name}</strong> devient la commune de la plateforme
        {current ? (
          <>
            {' '}à la place de <strong>{current.name}</strong>
          </>
        ) : null}
        . Son dépôt, ses distances maximales et ses localités s’appliquent aussitôt à toutes les nouvelles réservations
        et aux demandes d’organisation.
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleActivate} loading={activating}>
          Activer {municipality.name}
        </Button>
      </div>
    </div>
  )
}
