import { useState } from 'react'
import { syncLocalities } from '../../api/municipalities'
import { formatDateTime } from '../../lib/dates'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant de synchroniser les localités avec GeoNames (effets expliqués : ajout, réactivation,
// désactivation des localités GeoNames disparues, centre de la commune mis à jour)
export function SyncLocalitiesModal({ municipality, open, onClose, onSynced }) {
  return (
    <Modal open={open} onClose={onClose} title="Synchroniser avec GeoNames">
      {open && <SyncForm municipality={municipality} onClose={onClose} onSynced={onSynced} />}
    </Modal>
  )
}

function SyncForm({ municipality, onClose, onSynced }) {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      onSynced(await syncLocalities(municipality.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setSyncing(false)
    }
  }

  return (
    <div className="grid gap-4 text-sm">
      <p>La liste des localités de {municipality.name} est relue sur GeoNames :</p>
      <ul className="grid list-disc gap-1 pl-5">
        <li>les nouvelles localités sont ajoutées, et celles qui reviennent sont réactivées ;</li>
        <li>les localités GeoNames absentes de la réponse sont désactivées ;</li>
        <li>les localités ajoutées à la main ne changent pas ;</li>
        <li>le centre de la commune est mis à jour (il sert de repère quand aucun dépôt n’est défini).</li>
      </ul>
      {municipality.synced_at && (
        <p className="text-muted">Dernière synchronisation : {formatDateTime(municipality.synced_at)}.</p>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button onClick={handleSync} loading={syncing}>
          Synchroniser
        </Button>
      </div>
    </div>
  )
}
