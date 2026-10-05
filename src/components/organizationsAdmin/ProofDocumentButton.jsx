import { FileText } from 'lucide-react'
import { useState } from 'react'
import { downloadDocument } from '../../api/documents'
import { getBlobErrorMessage, saveBlob, showBlobIn } from '../../lib/documents'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'

// Justificatif d'une organisation (joint à sa demande de création) : consultation seulement, dans un nouvel onglet
export function ProofDocumentButton({ documentId }) {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState(null)

  async function handleOpen() {
    // Onglet ouvert pendant le clic, rempli quand le fichier est arrivé (sinon bloqué comme popup)
    const tab = window.open('', '_blank')
    setOpening(true)
    setError(null)
    try {
      const blob = await downloadDocument(documentId)
      if (tab) showBlobIn(tab, blob)
      else saveBlob(blob, `justificatif-${documentId}`)
    } catch (err) {
      tab?.close()
      setError(await getBlobErrorMessage(err))
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className="grid gap-2">
      <div>
        <Button variant="secondary" onClick={handleOpen} loading={opening}>
          <FileText className="size-4" aria-hidden="true" /> Ouvrir le justificatif
        </Button>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
