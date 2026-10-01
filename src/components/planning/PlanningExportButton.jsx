import { FileSpreadsheet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { downloadDocument, getDocument } from '../../api/documents'
import { getPlanningExport, requestPlanningExport } from '../../api/planning'
import { getBlobErrorMessage, saveBlob } from '../../lib/documents'
import { getErrorMessage } from '../../lib/errors'
import { Button } from '../ui/Button'

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 60 // 2 minutes

// Export Excel préparé en tâche de fond (tient avec de grosses périodes) :
//   1. on demande l'export (POST /planning/exports) avec les filtres affichés au moment du clic
//   2. toutes les 2 s, on demande où il en est (GET /planning/exports/{id})
//        si « succeeded » → on télécharge le document et on l'enregistre sous son nom
//        si « failed »    → on affiche l'erreur du backend
//        sinon            → on attend encore (2 minutes au plus)
export function PlanningExportButton({ exportParams, disabled }) {
  const [exportState, setExportState] = useState({ step: 'idle' }) // idle, preparing, downloading, done, error
  const pollTimer = useRef(null)

  // Page quittée pendant l'attente : on arrête de demander
  useEffect(() => () => clearTimeout(pollTimer.current), [])

  async function startExport() {
    clearTimeout(pollTimer.current)
    setExportState({ step: 'preparing' })
    try {
      const planningExport = await requestPlanningExport(exportParams)
      waitForExport(planningExport.id, 0)
    } catch (error) {
      setExportState({ step: 'error', message: getErrorMessage(error) })
    }
  }

  function waitForExport(exportId, attempt) {
    pollTimer.current = setTimeout(async () => {
      try {
        const planningExport = await getPlanningExport(exportId)
        if (planningExport.status === 'succeeded') {
          downloadExport(planningExport.document_id)
        } else if (planningExport.status === 'failed') {
          setExportState({ step: 'error', message: planningExport.error_message ?? "L'export a échoué." })
        } else if (attempt + 1 >= MAX_POLL_ATTEMPTS) {
          setExportState({
            step: 'error',
            message: "L'export prend plus de temps que prévu. Réessayez dans quelques minutes.",
          })
        } else {
          waitForExport(exportId, attempt + 1)
        }
      } catch (error) {
        setExportState({ step: 'error', message: getErrorMessage(error) })
      }
    }, POLL_INTERVAL_MS)
  }

  async function downloadExport(documentId) {
    setExportState({ step: 'downloading' })
    try {
      const [documentInfo, fileBlob] = await Promise.all([getDocument(documentId), downloadDocument(documentId)])
      saveBlob(fileBlob, documentInfo.file_name)
      setExportState({ step: 'done', fileName: documentInfo.file_name })
    } catch (error) {
      setExportState({ step: 'error', message: await getBlobErrorMessage(error) })
    }
  }

  const busy = exportState.step === 'preparing' || exportState.step === 'downloading'

  return (
    <div className="grid justify-items-start gap-1.5 sm:justify-items-end">
      <Button variant="secondary" onClick={startExport} loading={busy} disabled={disabled}>
        <FileSpreadsheet className="size-4" aria-hidden="true" />
        Exporter en Excel
      </Button>
      <p aria-live="polite" className="text-xs text-muted">
        {exportState.step === 'preparing' && "Préparation de l'export…"}
        {exportState.step === 'downloading' && 'Téléchargement…'}
        {exportState.step === 'done' && `${exportState.fileName} téléchargé.`}
      </p>
      {exportState.step === 'error' && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {exportState.message}
        </p>
      )}
    </div>
  )
}
