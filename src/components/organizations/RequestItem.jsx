import { formatDateTime } from '../../lib/dates'
import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS, REQUEST_STATUS_LABELS } from '../../lib/labels'
import { REQUEST_STATUS_TONES } from '../../lib/organizations'
import { Badge } from '../ui/Badge'
import { ProofControls } from './ProofControls'

const STATUS_HINTS = {
  adhesion: {
    en_attente: 'En cours d’examen par la commune.',
    approuve: 'Vous faites maintenant partie de cette organisation.',
  },
  creation: {
    en_attente: 'En cours d’examen par la commune.',
    approuve: 'L’organisation a été créée : vous en faites partie.',
  },
}

// Une de mes demandes : adhésion à une organisation ou création d'une organisation
export function RequestItem({ kind, request, onChanged }) {
  const title =
    kind === 'adhesion'
      ? `Rejoindre ${request.organization?.name ?? 'une organisation'}`
      : `Créer ${request.organization_name}`
  const detail =
    kind === 'adhesion'
      ? `Rôle demandé : ${RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role}`
      : request.organization_type_label ?? ORGANIZATION_TYPE_LABELS[request.organization_type]
  const pending = request.status === 'en_attente'

  return (
    <li>
      <article className="grid gap-2 rounded-xl border border-line bg-surface px-5 py-4.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={REQUEST_STATUS_TONES[request.status] ?? 'neutral'}>
            {request.status_label ?? REQUEST_STATUS_LABELS[request.status]}
          </Badge>
          <span className="text-xs text-muted">
            {kind === 'adhesion' ? 'Demande d’adhésion' : 'Demande de création'} · envoyée le {formatDateTime(request.created_at)}
          </span>
        </div>
        <h3 className="text-[17px] font-bold">{title}</h3>
        <p className="text-sm text-muted">{detail}</p>
        {request.status === 'refuse' ? (
          request.rejection_reason && <p className="text-sm text-danger">Motif du refus : {request.rejection_reason}</p>
        ) : (
          <p className="text-sm">{STATUS_HINTS[kind][request.status]}</p>
        )}
        {pending && (
          <div className="mt-1 border-t border-line pt-3">
            <ProofControls kind={kind} requestId={kind === 'adhesion' ? request.request_id : request.id} hasProof={Boolean(request.proof_document_id)} onChanged={onChanged} />
          </div>
        )}
      </article>
    </li>
  )
}
