import { Link, Outlet } from 'react-router'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'

// Pages publiques : connexion, inscription, mot de passe oublié… `wide` : page de lecture (politique de confidentialité)
export function PublicLayout({ wide = false }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 sm:px-8">
        <Link to="/" aria-label="OuKiLéMonBus, accueil">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className={wide ? 'flex flex-1 justify-center px-4 py-10' : 'flex flex-1 items-start justify-center px-4 py-10 sm:items-center'}>
        <div className={wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
