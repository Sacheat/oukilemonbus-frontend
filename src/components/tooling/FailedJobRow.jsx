import { Eye, RotateCcw, Trash2 } from 'lucide-react'
import { formatDateTime } from '../../lib/dates'
import { exceptionParts, shortClassName } from '../../lib/tooling'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// Une ligne de job en échec : file, job (nom court, nom complet en infobulle), exception résumée, date,
// et ses actions. `busy` : action en cours sur cette ligne.
export function FailedJobRow({ job, busy, onOpen, onRetry, onDelete }) {
  const exception = exceptionParts(job.exception_summary)
  return (
    <li className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold break-all" title={job.job}>
            {shortClassName(job.job)}
          </span>
          <Badge tone="neutral">{job.queue}</Badge>
          <span className="text-xs text-muted tabular-nums">{formatDateTime(job.failed_at)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs break-words text-muted" title={job.exception_summary}>
          {exception.type && <span className="font-semibold text-danger">{exception.type} : </span>}
          {exception.message}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onOpen(job)} className="px-3" aria-label={`Voir le job n° ${job.id}`}>
          <Eye className="size-4" aria-hidden="true" /> Voir
        </Button>
        <Button variant="secondary" onClick={() => onRetry(job)} loading={busy === 'retry'} disabled={Boolean(busy)} className="px-3">
          <RotateCcw className="size-4" aria-hidden="true" /> Relancer
        </Button>
        <Button variant="secondary" onClick={() => onDelete(job)} disabled={Boolean(busy)} className="px-3" aria-label={`Supprimer le job n° ${job.id}`}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}
