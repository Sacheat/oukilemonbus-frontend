import { Download, ExternalLink, FileText } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { downloadDocument } from '../../api/documents'
import { formatDate, formatDateTime } from '../../lib/dates'
import { formatFileSize, getBlobErrorMessage, saveBlob, showBlobIn } from '../../lib/documents'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// Un document : type, réservation liée (lien vers le déplacement), date, version, taille,
// puis « Ouvrir » (nouvel onglet) et « Télécharger ». `showReservation` : false dans le détail d'un déplacement.
export function DocumentRow({ document: doc, showReservation = true }) {
  const [busy, setBusy] = useState(null) // 'open' | 'download'
  const [error, setError] = useState(null)
  const errorId = useId()
  const type = doc.document_type_label ?? DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type
  const reservation = doc.reservation

  async function handleOpen() {
    // Onglet ouvert pendant le clic, rempli quand le fichier est arrivé (sinon bloqué comme popup)
    const tab = window.open('', '_blank')
    setBusy('open')
    setError(null)
    try {
      const blob = await downloadDocument(doc.id)
      if (tab) showBlobIn(tab, blob)
      else saveBlob(blob, doc.file_name)
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
      saveBlob(await downloadDocument(doc.id), doc.file_name)
    } catch (err) {
      setError(await getBlobErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="grid gap-2 px-5.5 py-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <FileText className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{type}</p>
            {doc.version > 1 && <Badge tone="info">Version {doc.version}</Badge>}
            {doc.is_official && <Badge tone="success">Officiel</Badge>}
          </div>
          {showReservation && reservation && (
            <p className="text-sm">
              <Link to={`/espace/deplacements/${reservation.id}`} className="font-semibold text-link hover:underline">
                {reservation.trip_purpose}
              </Link>
              <span className="text-muted"> · trajet du {formatDate(reservation.trip_date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          )}
          <p className="text-xs break-all text-muted">{doc.file_name}</p>
          <p className="text-xs text-muted">
            {formatFileSize(doc.file_size)} · créé le {formatDateTime(doc.generated_at ?? doc.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="text-sm"
            onClick={handleOpen}
            loading={busy === 'open'}
            disabled={busy !== null}
            aria-label={`Ouvrir ${doc.file_name} dans un nouvel onglet`}
            aria-describedby={error ? errorId : undefined}
          >
            <ExternalLink className="size-4" aria-hidden="true" /> Ouvrir
          </Button>
          <Button
            variant="secondary"
            className="text-sm"
            onClick={handleDownload}
            loading={busy === 'download'}
            disabled={busy !== null}
            aria-label={`Télécharger ${doc.file_name}`}
            aria-describedby={error ? errorId : undefined}
          >
            <Download className="size-4" aria-hidden="true" /> Télécharger
          </Button>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </li>
  )
}
