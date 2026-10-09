import { ChevronRight, Paperclip } from 'lucide-react'
import { cx } from '../../lib/cx'
import { formatRelative } from '../../lib/dates'
import { REQUEST_STATUS_LABELS } from '../../lib/labels'
import { REQUEST_STATUS_TONES, requestSummary, staleDays } from '../../lib/requests'
import { OrganizationAvatar } from '../organizations/OrganizationAvatar'
import { Badge } from '../ui/Badge'
import { ConfidenceScore } from './ConfidenceScore'

// Score, justificatif et statut d'une demande (à droite en grand écran, sous le texte sur mobile)
function RequestBadges({ request, showStatus, className }) {
  return (
    <span className={cx('flex flex-wrap items-center gap-1.5', className)}>
      <ConfidenceScore score={request.confidence_note} level={request.confidence_level} levelLabel={request.confidence_level_label} />
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
  )
}

// Une demande, cliquable : organisation (visée ou demandée), rôle ou type, demandeur, ancienneté, score,
// justificatif et statut (`showStatus` : hors file « à traiter » ; toujours affiché pour une demande déjà traitée).
// Demande en attente depuis plus de 7 jours : bordure et « En attente depuis N jours » en orange (staleDays).
// Sous 640 px, les badges passent sous le texte pour laisser la largeur au nom.
export function RequestRow({ kind, request, showStatus, onOpen }) {
  const summary = requestSummary(kind, request)
  const waited = staleDays(request)

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cx(
          'flex min-h-11 w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left text-sm transition hover:bg-surface-muted sm:px-5',
          waited ? 'border-warning' : 'border-transparent',
        )}
      >
        <OrganizationAvatar name={summary.title} className="size-10 shrink-0 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold break-words">{summary.title}</span>
          <span className="block text-muted">{summary.detail}</span>
          <span className="block text-xs text-muted">
            {summary.requester?.full_name ?? 'Demandeur inconnu'} ·{' '}
            {waited ? (
              <span className="font-semibold text-warning">En attente depuis {waited} jours</span>
            ) : (
              formatRelative(request.created_at)
            )}
          </span>
          <RequestBadges request={request} showStatus={showStatus} className="mt-2 sm:hidden" />
        </span>
        <RequestBadges request={request} showStatus={showStatus} className="hidden shrink-0 flex-col items-end sm:flex" />
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
    </li>
  )
}
