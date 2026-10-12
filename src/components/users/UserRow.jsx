import { ChevronRight } from 'lucide-react'
import { ROLE_TONES, sortedRoles } from '../../lib/users'
import { cx } from '../../lib/cx'
import { isAnonymized } from '../../lib/privacy'
import { OrganizationAvatar } from '../organizations/OrganizationAvatar'
import { Badge } from '../ui/Badge'

// Ligne d'un compte, cliquable en entière pour ouvrir le panneau : initiales, nom, email, rôles et état ;
// `selected` : compte ouvert dans le panneau
export function UserRow({ user, selected, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(user)}
        aria-current={selected ? 'true' : undefined}
        className={cx(
          'flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted sm:px-5',
          selected && 'bg-surface-muted',
          !user.active && 'opacity-70',
        )}
      >
        <OrganizationAvatar name={user.full_name} className="size-10 rounded-full text-sm" />
        <span className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4">
          <span className="min-w-0">
            <span className="block font-semibold break-words">{user.full_name}</span>
            <span className="block truncate text-sm text-muted">{user.email}</span>
          </span>
          <span className="flex flex-wrap gap-1.5">
            {sortedRoles(user.roles).map((role) => (
              <Badge key={role.value} tone={ROLE_TONES[role.value]}>
                {role.label}
              </Badge>
            ))}
            {user.roles?.length === 0 && !isAnonymized(user) && <Badge tone="warning">Aucun rôle</Badge>}
            {isAnonymized(user) ? (
              <Badge tone="neutral">Anonymisé</Badge>
            ) : (
              <>
                {!user.active && <Badge tone="neutral">Désactivé</Badge>}
                {!user.email_verified_at && <Badge tone="warning">Email non vérifié</Badge>}
              </>
            )}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
    </li>
  )
}
