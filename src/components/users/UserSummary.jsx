import { formatDay } from '../../lib/dates'
import { ROLE_TONES, sortedRoles } from '../../lib/users'
import { OrganizationAvatar } from '../organizations/OrganizationAvatar'
import { Badge } from '../ui/Badge'

// En-tête du panneau d'un compte : initiales, coordonnées, rôles, état et date de création
export function UserSummary({ user }) {
  return (
    <div className="flex items-start gap-4 rounded-card border border-line bg-surface p-4">
      <OrganizationAvatar name={user.full_name} className="size-12 rounded-full" />
      <div className="grid min-w-0 gap-2">
        <div className="min-w-0 text-sm">
          <p className="font-bold break-words">{user.full_name}</p>
          <p className="break-all text-muted">{user.email}</p>
          {user.phone && <p className="text-muted">{user.phone}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sortedRoles(user.roles).map((role) => (
            <Badge key={role.value} tone={ROLE_TONES[role.value]}>
              {role.label}
            </Badge>
          ))}
          {!user.active && <Badge tone="neutral">Désactivé</Badge>}
          {!user.email_verified_at && <Badge tone="warning">Email non vérifié</Badge>}
        </div>
        {user.created_at && (
          <p className="text-xs text-muted">
            Compte créé le {formatDay(user.created_at)}
          </p>
        )}
      </div>
    </div>
  )
}
