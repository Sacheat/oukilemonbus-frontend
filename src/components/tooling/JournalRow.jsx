import { ChevronRight } from 'lucide-react'
import { formatDateTime } from '../../lib/dates'
import { formatDuration, httpStatusTone } from '../../lib/tooling'
import { Badge } from '../ui/Badge'

// Une entrée du journal, cliquable : heure, titre du flow (« — » sans flow), méthode et chemin, auteur, code HTTP, durée
export function JournalRow({ entry, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface-muted sm:px-5"
      >
        <span className="w-24 shrink-0 text-xs text-muted tabular-nums">{formatDateTime(entry.created_at)}</span>
        <span className="min-w-0 flex-1">
          {/* Les entrées enregistrées avant l'ajout des flows peuvent ne pas en avoir */}
          <span className="block font-semibold break-words">{entry.flow?.title ?? '—'}</span>
          <span className="block font-mono text-xs break-all text-muted">
            {entry.method} {entry.path}
          </span>
          <span className="block text-xs text-muted">{entry.user?.email ?? 'Sans compte connecté'}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={httpStatusTone(entry.http_status)}>{entry.http_status}</Badge>
          <span className="text-xs text-muted tabular-nums">{formatDuration(entry.duration_ms)}</span>
        </span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
    </li>
  )
}
