import { Download, ExternalLink, FileText } from 'lucide-react'
import { useState } from 'react'
import { downloadDocument } from '../../api/documents'
import { formatDate, formatDateTime } from '../../lib/dates'
import { getBlobErrorMessage, saveBlob, showBlobIn } from '../../lib/documents'
import { sheetTripsText } from '../../lib/routeSheets'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'

// Feuille officielle d'un jour et d'un véhicule (carnet de bord) : date, plaque, trajets, version et date de
// génération, puis « Ouvrir » (nouvel onglet) et « Télécharger »
export function RouteSheetRow({ sheet }) {
  const [busy, setBusy] = useState(null) // 'open' | 'download'
  const [error, setError] = useState(null)

  async function handleOpen() {
    const tab = window.open('', '_blank')
    setBusy('open')
    setError(null)
    try {
      const blob = await downloadDocument(sheet.id)
      if (tab) showBlobIn(tab, blob)
      else saveBlob(blob, sheet.file_name)
    } catch (err) {
      tab?.close()
      setError(await getBlobErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function handleDownload() {
    setBusy('download')
    setError(null)
    try {
      saveBlob(await downloadDocument(sheet.id), sheet.file_name)
    } catch (err) {
      setError(await getBlobErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="grid gap-2 p-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-info-soft text-info">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold first-letter:uppercase">{formatDate(sheet.service_date)}</p>
          <p className="text-sm text-muted">
            {sheet.vehicle?.licence_plate ?? 'Véhicule inconnu'} · {sheetTripsText(sheet)}
          </p>
          <p className="text-xs text-muted">
            Version {sheet.version}, générée le {formatDateTime(sheet.generated_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleOpen} loading={busy === 'open'} disabled={busy !== null}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Ouvrir
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownload}
            loading={busy === 'download'}
            disabled={busy !== null}
            aria-label={`Télécharger la feuille du ${formatDate(sheet.service_date)}`}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </li>
  )
}
