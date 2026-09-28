import { Link, Outlet } from 'react-router'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'

// Pages sans session : connexion, et plus tard inscription, mot de passe oublié…
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 sm:px-8">
        <Link to="/" aria-label="OuKiLéMonBus, accueil">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
