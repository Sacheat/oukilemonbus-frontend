import { cx } from '../../lib/cx'
import { organizationInitials } from '../../lib/organizations'

// Pastille aux initiales d'une organisation (décorative : le nom est toujours écrit à côté)
export function OrganizationAvatar({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cx('grid size-12 shrink-0 place-items-center rounded-xl bg-soft text-base font-extrabold text-link', className)}
    >
      {organizationInitials(name)}
    </span>
  )
}
