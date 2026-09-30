import { Pencil, UserMinus } from 'lucide-react'
import { formatDay } from '../../lib/dates'
import { RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { OrganizationAvatar } from './OrganizationAvatar'

// Un membre de l'organisation. Coordonnées et actions affichées aux responsables seulement ;
// pas d'action sur sa propre ligne (on passe par « Quitter » dans Mes organisations).
export function MemberRow({ member, isMe, canManage, onEditRole, onRemove }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
      <OrganizationAvatar
        name={member.full_name}
        className="size-10 rounded-full text-sm"
        colors={member.is_manager ? 'bg-info-soft text-info' : 'bg-neutral-soft text-neutral'}
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
          <span>
            {member.full_name}
            {isMe && <span className="font-normal text-muted"> (vous)</span>}
          </span>
          <Badge tone={member.is_manager ? 'info' : 'neutral'}>
            {RELATIONSHIP_TYPE_LABELS[member.relationship_type] ?? member.relationship_type}
          </Badge>
        </p>
        <p className="mt-0.5 text-sm break-words text-muted">
          {[canManage && member.email, canManage && member.phone, member.joined_at && `depuis le ${formatDay(member.joined_at)}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {canManage && !isMe && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="text-sm"
            onClick={() => onEditRole(member)}
            aria-label={`Modifier le rôle : ${member.full_name}`}
          >
            <Pencil className="size-4" aria-hidden="true" /> Modifier le rôle
          </Button>
          <Button variant="secondary" className="text-sm" onClick={() => onRemove(member)} aria-label={`Retirer : ${member.full_name}`}>
            <UserMinus className="size-4" aria-hidden="true" /> Retirer
          </Button>
        </div>
      )}
    </li>
  )
}
