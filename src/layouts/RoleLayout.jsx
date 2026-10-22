import { getLandingPath } from '../auth/spaces'
import { useAuth } from '../auth/useAuth'
import { BACKOFFICE_NAV, DRIVER_NAV, USER_NAV } from '../navigation'
import { SidebarLayout } from './SidebarLayout'
import { TopNavLayout } from './TopNavLayout'

// Layout de l'espace choisi par l'utilisateur, pour les pages communes à tous les rôles (ex. /compte)
export function RoleLayout() {
  const { user } = useAuth()
  const home = getLandingPath(user)
  if (home === '/gestion') return <SidebarLayout sections={BACKOFFICE_NAV} />
  return <TopNavLayout nav={home === '/chauffeur' ? DRIVER_NAV : USER_NAV} />
}
