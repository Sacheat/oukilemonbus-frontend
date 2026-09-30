import { cx } from '../../lib/cx'
import { organizationInitials } from '../../lib/organizations'

// Pastille aux initiales d'une organisation, ou d'une personne avec `className` (ex. rounded-full) ;
// `colors` remplace les couleurs par défaut (décorative : le nom est toujours écrit à côté)
export function OrganizationAvatar({ name, className, colors = 'bg-soft text-link' }) {
  return (
    <span
      aria-hidden="true"
      className={cx('grid size-12 shrink-0 place-items-center rounded-xl text-base font-extrabold', colors, className)}
    >
      {organizationInitials(name)}
    </span>
  )
}
