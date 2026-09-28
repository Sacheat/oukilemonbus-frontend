import { getHomePath } from '../auth/permissions'
import { useAuth } from '../auth/useAuth'
import { BACKOFFICE_NAV, DRIVER_NAV, USER_NAV } from '../navigation'
import { SidebarLayout } from './SidebarLayout'
import { TopNavLayout } from './TopNavLayout'

// Layout de l'espace de l'utilisateur, pour les pages communes à tous les rôles (ex. /compte)
export function RoleLayout() {
  const { user } = useAuth()
  const home = getHomePath(user)
  if (home === '/gestion') return <SidebarLayout sections={BACKOFFICE_NAV} />
  return <TopNavLayout nav={home === '/chauffeur' ? DRIVER_NAV : USER_NAV} />
}
