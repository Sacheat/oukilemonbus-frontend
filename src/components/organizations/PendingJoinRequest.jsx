import { formatDateTime } from '../../lib/dates'
import { RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { OrganizationAvatar } from './OrganizationAvatar'

// Demande d'adhésion reçue par l'organisation, en lecture seule (la commune décide)
export function PendingJoinRequest({ request }) {
  const requester = request.requested_by_user
  return (
    <li className="flex gap-3.5 px-5 py-3.5">
      <OrganizationAvatar name={requester?.full_name ?? '?'} className="size-10 rounded-full text-sm" colors="bg-warning-soft text-warning" />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="font-semibold">
          {requester?.full_name ?? 'Un utilisateur'}
          <span className="font-normal text-muted">
            {' '}
            · {RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role}
          </span>
        </p>
        <p className="text-sm break-words text-muted">
          {[requester?.email, `envoyée le ${formatDateTime(request.created_at)}`, request.proof_document_id && 'justificatif joint']
            .filter(Boolean)
            .join(' · ')}
        </p>
        {request.justification && <p className="text-sm break-words">« {request.justification} »</p>}
      </div>
    </li>
  )
}
