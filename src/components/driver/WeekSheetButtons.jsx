import { Download, Printer } from 'lucide-react'
import { useState } from 'react'
import { downloadDriverWeekSheet } from '../../api/routeSheets'
import { getBlobErrorMessage, saveBlob, showBlobIn } from '../../lib/documents'
import { weekSheetFileName } from '../../lib/routeSheets'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'

// Feuille de la semaine en PDF (générée à la demande par le backend, donc à jour) :
//   « Imprimer »    → ouverte dans un nouvel onglet, où le navigateur propose l'impression
//   « Télécharger » → enregistrée sur l'appareil (à imprimer plus tard, ou sans réseau)
export function WeekSheetButtons({ weekStart }) {
  const [busy, setBusy] = useState(null) // 'print' | 'download'
  const [error, setError] = useState(null)

  async function handlePrint() {
    // Onglet ouvert pendant le clic, rempli quand le fichier est arrivé (sinon bloqué comme popup)
    const tab = window.open('', '_blank')
    setBusy('print')
    setError(null)
    try {
      const blob = await downloadDriverWeekSheet(weekStart)
      if (tab) showBlobIn(tab, blob)
      else saveBlob(blob, weekSheetFileName(weekStart))
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
      saveBlob(await downloadDriverWeekSheet(weekStart), weekSheetFileName(weekStart))
    } catch (err) {
      setError(await getBlobErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePrint} loading={busy === 'print'} disabled={busy !== null}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimer ma feuille
        </Button>
        <Button variant="secondary" onClick={handleDownload} loading={busy === 'download'} disabled={busy !== null}>
          <Download className="size-4" aria-hidden="true" />
          Télécharger
        </Button>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
