import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { getLandingPath, getSpaces, rememberSpace, spaceOfPath } from '../auth/spaces'
import { useAuth } from '../auth/useAuth'
import { cx } from '../lib/cx'

// Bascule entre les espaces d'un utilisateur à plusieurs rôles (rien s'il n'en a qu'un).
// `className` fixe l'affichage (flex, hidden…) ; `inverted` : sur le fond sombre de la barre latérale du back-office.
export function SpaceSwitcher({ className, inverted = false, onNavigate }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const visited = spaceOfPath(pathname)?.path

  // Le dernier espace visité (par ce sélecteur, un tutoriel, une notification…) devient l'espace d'arrivée
  useEffect(() => {
    if (visited) rememberSpace(visited)
  }, [visited])

  const spaces = getSpaces(user)
  if (spaces.length < 2) return null

  // Sur une page commune (/compte…), l'espace courant est celui dont le layout est affiché
  const current = visited ?? getLandingPath(user)

  return (
    <nav aria-label="Changer d'espace" className={cx('rounded-control border p-1', inverted ? 'border-white/15' : 'border-line-strong bg-surface', className)}>
      {spaces.map((space) => {
        const selected = space.path === current
        return (
          <Link
            key={space.path}
            to={space.path}
            aria-current={selected ? 'page' : undefined}
            title={`Espace ${space.label.toLowerCase()}`}
            onClick={onNavigate}
            className={cx(
              'inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap',
              selected
                ? inverted
                  ? 'bg-nav-selected text-white'
                  : 'bg-primary text-on-primary'
                : inverted
                  ? 'text-nav-ink hover:bg-white/5'
                  : 'text-muted hover:text-ink',
            )}
          >
            <space.icon className="size-4" aria-hidden="true" />
            {space.label}
          </Link>
        )
      })}
    </nav>
  )
}
