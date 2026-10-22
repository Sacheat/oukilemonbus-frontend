import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoader } from '../components/ui/Loader'
import { EmailNotVerifiedPage } from '../pages/errors/EmailNotVerifiedPage'
import { ForbiddenPage } from '../pages/errors/ForbiddenPage'
import { ServerUnavailablePage } from '../pages/errors/ServerUnavailablePage'
import { getHomePath, isEmailVerified } from './permissions'
import { useAuth } from './useAuth'

// Pages réservées aux invités (connexion…) : un utilisateur connecté est renvoyé vers son espace
export function RequireGuest() {
  const { user, status } = useAuth()
  if (status === 'loading') return <FullPageLoader />
  if (status === 'unavailable') return <ServerUnavailablePage />
  if (user) return <Navigate to={getHomePath(user)} replace />
  return <Outlet />
}

// Connecté et email vérifié
export function RequireAuth() {
  const { user, status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageLoader />
  if (status === 'unavailable') return <ServerUnavailablePage />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location }} />
  if (!isEmailVerified(user)) return <EmailNotVerifiedPage />
  return <Outlet />
}

// Au moins un des rôles globaux
export function RequireRole({ roles }) {
  const { hasRole } = useAuth()
  return hasRole(...roles) ? <Outlet /> : <ForbiddenPage fullScreen />
}

// Permission requise pour une page : <RequirePermission permission="users.manage-roles"><Page /></RequirePermission>
export function RequirePermission({ permission, children }) {
  const { can } = useAuth()
  if (!can(permission)) return <ForbiddenPage />
  return children ?? <Outlet />
}

// Racine : redirige vers l'espace du rôle, ou vers la connexion
export function RootRedirect() {
  const { user, status } = useAuth()
  if (status === 'loading') return <FullPageLoader />
  if (status === 'unavailable') return <ServerUnavailablePage />
  return <Navigate to={user ? getHomePath(user) : '/connexion'} replace />
}
