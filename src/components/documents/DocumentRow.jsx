import { Download, ExternalLink, FileText } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { downloadDocument } from '../../api/documents'
import { cx } from '../../lib/cx'
import { formatDate, formatDateTime } from '../../lib/dates'
import { fileKind, formatFileSize, getBlobErrorMessage, saveBlob, showBlobIn } from '../../lib/documents'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// Un document : tuile du type de fichier, type et badges, mini-billet du déplacement lié (lien), nom, taille
// et date, puis « Ouvrir » (nouvel onglet) et « Télécharger ». `showReservation` : false dans le détail d'un déplacement.
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

  const kind = fileKind(doc.mime_type)

  return (
    <li className="grid min-w-0 gap-2 p-4 sm:px-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <span aria-hidden="true" className={cx('grid size-12 shrink-0 place-items-center rounded-xl', kind.colors)}>
          <FileText className="size-5" />
          <span className="-mt-1.5 text-[10px] font-extrabold">{kind.label}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{type}</p>
            {doc.version > 1 && <Badge tone="info">Version {doc.version}</Badge>}
            {doc.is_official && <Badge tone="success">Officiel</Badge>}
          </div>
          {showReservation && reservation && (
            <Link
              to={`/espace/deplacements/${reservation.id}`}
              className="group mt-1.5 inline-flex max-w-full items-center gap-2.5 rounded-lg border border-line py-1 pr-3 pl-1 hover:border-primary"
            >
              <span aria-hidden="true" className="grid w-10 shrink-0 place-content-center rounded-md bg-accent py-1 text-center leading-none text-on-accent">
                <span className="text-[9px] font-bold uppercase">
                  {formatDate(reservation.trip_date, { month: 'short' }).replace('.', '')}
                </span>
                <span className="text-base font-extrabold">{Number(reservation.trip_date.slice(8, 10))}</span>
              </span>
              <span className="min-w-0 text-sm">
                <span className="block truncate font-semibold text-link group-hover:underline">{reservation.trip_purpose}</span>
                <span className="block text-xs text-muted">
                  Trajet du {formatDate(reservation.trip_date, { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </span>
            </Link>
          )}
          <p className="mt-1.5 text-xs break-all text-muted">
            {doc.file_name} · {formatFileSize(doc.file_size)} · créé le {formatDateTime(doc.generated_at ?? doc.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col">
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
