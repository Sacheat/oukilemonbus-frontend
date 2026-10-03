import { ChevronRight, Paperclip } from 'lucide-react'
import { formatRelative } from '../../lib/dates'
import { REQUEST_STATUS_LABELS } from '../../lib/labels'
import { REQUEST_STATUS_TONES, requestSummary } from '../../lib/requests'
import { OrganizationAvatar } from '../organizations/OrganizationAvatar'
import { Badge } from '../ui/Badge'
import { ConfidenceScore } from './ConfidenceScore'

// Une demande, cliquable : organisation (visée ou demandée), rôle ou type, demandeur, ancienneté, score,
// justificatif et statut (`showStatus` : hors file « à traiter » ; toujours affiché pour une demande déjà traitée)
export function RequestRow({ kind, request, showStatus, onOpen }) {
  const summary = requestSummary(kind, request)
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface-muted sm:px-5"
      >
        <OrganizationAvatar name={summary.title} className="size-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold break-words">{summary.title}</span>
          <span className="block text-muted">{summary.detail}</span>
          <span className="block text-xs text-muted">
            {summary.requester?.full_name ?? 'Demandeur inconnu'} · {formatRelative(request.created_at)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <ConfidenceScore
            score={request.confidence_note}
            level={request.confidence_level}
            levelLabel={request.confidence_level_label}
          />
          <span className="flex items-center gap-1.5">
            {request.proof_document_id && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Paperclip className="size-3.5" aria-hidden="true" /> Justificatif
              </span>
            )}
            {(showStatus || request.status !== 'en_attente') && (
              <Badge tone={REQUEST_STATUS_TONES[request.status] ?? 'neutral'}>
                {request.status_label ?? REQUEST_STATUS_LABELS[request.status]}
              </Badge>
            )}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
    </li>
  )
}
