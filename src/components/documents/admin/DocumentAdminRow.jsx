import { Download, ExternalLink, FileText } from 'lucide-react'
import { cx } from '../../../lib/cx'
import { formatDateTime } from '../../../lib/dates'
import { documentTitle } from '../../../lib/documentsAdmin'
import { fileKind, formatFileSize } from '../../../lib/documents'
import { useDocumentFile } from '../../../hooks/useDocumentFile'
import { Badge } from '../../ui/Badge'

const ICON_BUTTON =
  'grid size-11 place-items-center rounded-control border border-line-strong bg-surface text-muted hover:border-primary hover:text-link disabled:opacity-50'

// Ligne compacte d'un document dans /gestion/documents : la ligne ouvre le panneau (bouton étiré sur toute la
// ligne), Ouvrir et Télécharger restent à portée en boutons-icônes. Titre : type, date, véhicule ou motif.
export function DocumentAdminRow({ document: doc, selected, onOpen }) {
  const { busy, error, errorId, open, download } = useDocumentFile(doc)
  const kind = fileKind(doc.mime_type)

  return (
    <li className={cx('relative grid min-w-0 gap-1 hover:bg-surface-muted', selected && 'bg-surface-muted')}>
      <div className="flex items-center gap-3 p-3 sm:px-5">
        <span aria-hidden="true" className={cx('grid size-12 shrink-0 place-items-center rounded-xl', kind.colors)}>
          <FileText className="size-5" />
          <span className="-mt-1.5 text-[10px] font-extrabold">{kind.label}</span>
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            aria-describedby={error ? errorId : undefined}
            className="flex min-h-11 w-full flex-wrap items-center gap-x-2 gap-y-1 text-left font-bold after:absolute after:inset-0 after:content-['']"
          >
            <span className="min-w-0 truncate">{documentTitle(doc)}</span>
            {doc.version > 1 && <Badge tone="info">Version {doc.version}</Badge>}
            {doc.is_official && <Badge tone="success">Officiel</Badge>}
          </button>
          <p className="truncate text-xs text-muted">
            {formatFileSize(doc.file_size)} · créé le {formatDateTime(doc.generated_at ?? doc.created_at)}
          </p>
        </div>
        <div className="relative z-10 flex shrink-0 gap-2">
          <button type="button" className={ICON_BUTTON} onClick={open} disabled={busy !== null} aria-label={`Ouvrir ${doc.file_name} dans un nouvel onglet`}>
            <ExternalLink className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className={ICON_BUTTON} onClick={download} disabled={busy !== null} aria-label={`Télécharger ${doc.file_name}`}>
            <Download className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="px-5 pb-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </li>
  )
}
