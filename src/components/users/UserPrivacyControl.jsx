import { Download } from 'lucide-react'
import { useState } from 'react'
import { downloadUserPersonalData } from '../../api/users'
import { getBlobErrorMessage, saveBlob } from '../../lib/documents'
import { personalDataFileName } from '../../lib/privacy'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { AnonymizeUserModal } from './AnonymizeUserModal'

// Section « Données personnelles (RGPD) » du panneau d'un compte : export JSON (users.export-data) et anonymisation
// irréversible (users.anonymize, jamais son propre compte). Le backend refuse tant que le compte est encore engagé.
export function UserPrivacyControl({ user, self, canExport, canAnonymize, onAnonymized }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const showAnonymize = canAnonymize && !self

  if (!canExport && !showAnonymize) return null

  async function handleExport() {
    setDownloading(true)
    setError(null)
    try {
      saveBlob(await downloadUserPersonalData(user.id), personalDataFileName(user.id))
    } catch (err) {
      setError(await getBlobErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Données personnelles (RGPD)</h3>
      {error && <Alert tone="danger">{error}</Alert>}
      <p className="text-sm text-muted">
        À la demande de la personne : copie de ses données, ou effacement de son identité. Les réservations et documents
        officiels sont conservés.
      </p>
      <div className="flex flex-wrap gap-2">
        {canExport && (
          <Button variant="secondary" onClick={handleExport} loading={downloading}>
            <Download className="size-4" aria-hidden="true" /> Exporter ses données
          </Button>
        )}
        {showAnonymize && (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Anonymiser le compte
          </Button>
        )}
      </div>
      {showAnonymize && (
        <AnonymizeUserModal user={user} open={confirming} onClose={() => setConfirming(false)} onAnonymized={onAnonymized} />
      )}
    </section>
  )
}
