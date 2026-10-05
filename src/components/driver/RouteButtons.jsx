import { Navigation } from 'lucide-react'
import { cx } from '../../lib/cx'
import { ROUTE_TAB_NAME } from '../../lib/driverMissions'
import { navigationLink } from '../../lib/navigation'

const LINK = cx(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-bold transition',
)

function RouteLink({ link, className, children }) {
  if (!link) return null
  // geo: ouvre l'application du téléphone ; un lien web s'ouvre dans un onglet nommé, réutilisé aux clics suivants.
  // Pas de rel="noopener" : il empêcherait de retrouver l'onglet par son nom.
  return (
    <a href={link.href} target={link.external ? undefined : ROUTE_TAB_NAME} className={cx(LINK, className)}>
      <Navigation className="size-4" aria-hidden="true" />
      {children}
    </a>
  )
}

// Itinéraires avec l'application de la commune (`engine`, voir lib/navigation.js) : jusqu'au lieu de départ (depuis
// la position du téléphone), puis du départ à la destination (sur Android, depuis la position du téléphone aussi).
export function RouteButtons({ engine, pickup, destination }) {
  return (
    <div className="flex flex-wrap gap-2">
      <RouteLink link={navigationLink(engine, pickup)} className="bg-primary text-on-primary hover:bg-primary-hover">
        Itinéraire vers le départ
      </RouteLink>
      <RouteLink
        link={navigationLink(engine, destination, pickup)}
        className="border border-line-strong bg-surface text-ink hover:bg-surface-muted"
      >
        Départ → destination
      </RouteLink>
    </div>
  )
}
