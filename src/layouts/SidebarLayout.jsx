import { Menu, X } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { QueueCountProvider } from '../backoffice/QueueCountProvider'
import { NavCountBadge } from '../components/backoffice/NavCountBadge'
import { Loader } from '../components/ui/Loader'
import { Logo } from '../components/ui/Logo'
import { NotificationBell } from '../components/notifications/NotificationBell'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { TourLauncher } from '../components/tour/TourLauncher'
import { cx } from '../lib/cx'
import { isNavItemVisible } from '../navigation'
import { UserMenu } from './UserMenu'

// Disposition 02 de la DA : barre latérale (back-office agent et admin).
// `tour` : tutoriel de première connexion de l'espace (absent pour les pages communes comme /compte)
export function SidebarLayout({ sections, tour }) {
  const auth = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const visibleSections = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => isNavItemVisible(item, auth)) }))
    .filter((section) => section.items.length > 0)

  return (
    <QueueCountProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-hidden="true" onClick={() => setMenuOpen(false)} />
        )}

        <aside
          id="sidebar-nav"
          className={cx(
            'fixed inset-y-0 left-0 z-40 w-[250px] overflow-y-auto bg-nav px-4 py-7 text-white',
            'lg:sticky lg:top-0 lg:block lg:h-screen',
            menuOpen ? 'block' : 'hidden',
          )}
        >
          <div className="mb-9 flex items-center justify-between">
            <Link to="/gestion" aria-label="OuKiLéMonBus, tableau de bord">
              <Logo className="text-[17px]" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="grid size-11 place-items-center rounded-control hover:bg-white/10 lg:hidden"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Navigation principale" className="grid gap-6">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-3 text-[11px] tracking-[.13em] text-nav-muted uppercase">{section.title}</p>
                <ul className="grid gap-1">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        data-tour={`nav:${item.to}`}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          cx(
                            'flex min-h-11 items-center gap-3 rounded-control px-3 text-sm',
                            isActive ? 'bg-nav-selected font-bold text-white' : 'text-nav-ink hover:bg-white/5',
                          )
                        }
                      >
                        <item.icon className="size-4.5" aria-hidden="true" />
                        {item.label}
                        {item.badge && <NavCountBadge name={item.badge} />}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between gap-4 border-b-4 border-accent bg-surface px-5 py-2 lg:justify-end lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="sidebar-nav"
              aria-label="Ouvrir le menu"
              data-tour="menu"
              className="grid size-11 place-items-center rounded-control hover:bg-black/5 lg:hidden dark:hover:bg-white/10"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          <main className="px-5 py-8 sm:px-8 sm:py-9">
            {/* Page chargée à la demande (lazyPage) : Loader le temps de son premier téléchargement */}
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        {tour && <TourLauncher tour={tour} />}
      </div>
    </QueueCountProvider>
  )
}
