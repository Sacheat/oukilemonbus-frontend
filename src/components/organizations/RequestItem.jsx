import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS, REQUEST_STATUS_LABELS } from '../../lib/labels'
import { REQUEST_STATUS_TONES, requestSteps } from '../../lib/organizations'
import { Badge } from '../ui/Badge'
import { ProgressSteps } from '../ui/ProgressSteps'
import { OrganizationAvatar } from './OrganizationAvatar'
import { ProofControls } from './ProofControls'

const STATUS_HINTS = {
  adhesion: {
    approuve: 'Vous faites maintenant partie de cette organisation.',
  },
  creation: {
    approuve: 'L’organisation a été créée : vous en faites partie.',
  },
}

// Une de mes demandes (adhésion à une organisation ou création d'une organisation) : pastille, titre,
// suivi en trois étapes (envoyée, examen, décision), puis le justificatif tant qu'elle est en attente
export function RequestItem({ kind, request, onChanged, showProof = true }) {
  const title =
    kind === 'adhesion'
      ? `Rejoindre ${request.organization?.name ?? 'une organisation'}`
      : `Créer ${request.organization_name}`
  const detail =
    kind === 'adhesion'
      ? `Rôle demandé : ${RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role}`
      : request.organization_type_label ?? ORGANIZATION_TYPE_LABELS[request.organization_type]
  // Justificatif modifiable tant que la demande est en attente (sauf écran de fin : `showProof={false}`)
  const pending = showProof && request.status === 'en_attente'

  return (
    <li className="min-w-0">
      <article className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
        <div className="flex gap-4 p-5">
          <OrganizationAvatar
            name={kind === 'adhesion' ? request.organization?.name : request.organization_name}
            className="size-10 text-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">
              {kind === 'adhesion' ? 'Demande d’adhésion' : 'Demande de création'}
            </p>
            <h3 className="text-[17px] font-bold break-words">{title}</h3>
            <p className="text-sm text-muted">{detail}</p>
          </div>
          <Badge tone={REQUEST_STATUS_TONES[request.status] ?? 'neutral'} className="self-start">
            {request.status_label ?? REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>

        <div className="grid gap-3 px-5 pb-4">
          <ProgressSteps steps={requestSteps(request)} horizontal />
          {request.status === 'refuse' ? (
            request.rejection_reason && <p className="text-sm text-danger">Motif du refus : {request.rejection_reason}</p>
          ) : (
            // En attente, le suivi suffit (« Examen en cours »)
            STATUS_HINTS[kind][request.status] && <p className="text-sm">{STATUS_HINTS[kind][request.status]}</p>
          )}
        </div>

        {pending && (
          <div className="border-t border-line bg-surface-muted px-5 py-3">
            <ProofControls
              kind={kind}
              requestId={kind === 'adhesion' ? request.request_id : request.id}
              hasProof={Boolean(request.proof_document_id)}
              onChanged={onChanged}
            />
          </div>
        )}
      </article>
    </li>
  )
}
