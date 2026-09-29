import { formatDateTime } from '../../lib/dates'
import { RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'

// Demande d'adhésion reçue par l'organisation, en lecture seule (la commune décide)
export function PendingJoinRequest({ request }) {
  const requester = request.requested_by_user
  return (
    <li className="grid gap-1 px-5.5 py-3.5">
      <p className="font-semibold">
        {requester?.full_name ?? 'Un utilisateur'}
        <span className="font-normal text-muted">
          {' '}
          · {RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role}
        </span>
      </p>
      <p className="text-sm text-muted">
        {[requester?.email, `envoyée le ${formatDateTime(request.created_at)}`, request.proof_document_id && 'justificatif joint']
          .filter(Boolean)
          .join(' · ')}
      </p>
      {request.justification && <p className="text-sm break-words">« {request.justification} »</p>}
    </li>
  )
}
