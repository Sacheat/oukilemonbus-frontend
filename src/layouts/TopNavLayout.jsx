import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Logo } from '../components/ui/Logo'
import { NotificationBell } from '../components/notifications/NotificationBell'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { cx } from '../lib/cx'
import { isNavItemVisible } from '../navigation'
import { UserMenu } from './UserMenu'

// Disposition 01 de la DA : navigation en haut (espaces usager et chauffeur)
export function TopNavLayout({ nav }) {
  const auth = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const items = nav.filter((item) => isNavItemVisible(item, auth))

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link to={items[0]?.to ?? '/'} aria-label="OuKiLéMonBus, accueil">
            <Logo />
          </Link>

          <nav aria-label="Navigation principale" className="hidden xl:block">
            <ul className="flex gap-1">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cx(
                        'block rounded-control px-3 py-2 text-sm whitespace-nowrap',
                        isActive ? 'font-bold text-link' : 'text-muted hover:text-ink',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu className="hidden sm:flex" />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="grid size-11 place-items-center rounded-control hover:bg-black/5 xl:hidden dark:hover:bg-white/10"
            >
              {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" aria-label="Navigation principale" className="border-t border-line px-5 py-3 xl:hidden">
            <ul className="grid gap-1">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cx(
                        'flex min-h-11 items-center gap-3 rounded-control px-3',
                        isActive ? 'bg-soft font-bold text-link' : 'hover:bg-surface-muted',
                      )
                    }
                  >
                    <item.icon className="size-4.5" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <UserMenu className="mt-3 justify-between border-t border-line pt-3 sm:hidden" />
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1050px] px-5 py-8 sm:px-10 sm:py-9">
        <Outlet />
      </main>
    </div>
  )
}
