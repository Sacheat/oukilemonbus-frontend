import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { cx } from '../lib/cx'
import { ROLE_LABELS } from '../lib/labels'

// Nom de l'utilisateur connecté et bouton de déconnexion
export function UserMenu({ className, inverted = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    try {
      await logout()
    } finally {
      navigate('/connexion', { replace: true })
    }
  }

  const role = user?.roles?.map((name) => ROLE_LABELS[name] ?? name).join(', ')

  return (
    <div className={cx('flex items-center gap-3', className)}>
      <Link to="/compte" title="Mon compte" className="rounded-control px-2 py-1 text-right text-xs leading-tight hover:bg-black/5 dark:hover:bg-white/10">
        <span className="block font-bold">{user?.full_name}</span>
        {role && <span className={cx('block', inverted ? 'text-nav-muted' : 'text-muted')}>{role}</span>}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        aria-label="Se déconnecter"
        title="Se déconnecter"
        className="grid size-11 place-items-center rounded-control hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
      >
        <LogOut className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
