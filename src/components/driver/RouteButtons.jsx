import { Navigation } from 'lucide-react'
import { mapsDirectionsUrl, ROUTE_TAB_NAME } from '../../lib/driverMissions'
import { cx } from '../../lib/cx'

const LINK = cx(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-bold transition',
)

// Itinéraires Google Maps : jusqu'au lieu de départ (depuis la position du téléphone), puis du départ à la destination.
// Sur téléphone, le lien ouvre l'application de navigation ; sur PC, un onglet nommé, réutilisé aux clics suivants.
// Pas de rel="noopener" : il empêcherait de retrouver l'onglet par son nom (Google Maps est un site de confiance).
export function RouteButtons({ pickup, destination }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={mapsDirectionsUrl(pickup)}
        target={ROUTE_TAB_NAME}
        className={cx(LINK, 'bg-primary text-on-primary hover:bg-primary-hover')}
      >
        <Navigation className="size-4" aria-hidden="true" />
        Itinéraire vers le départ
      </a>
      <a
        href={mapsDirectionsUrl(destination, pickup)}
        target={ROUTE_TAB_NAME}
        className={cx(LINK, 'border border-line-strong bg-surface text-ink hover:bg-surface-muted')}
      >
        <Navigation className="size-4" aria-hidden="true" />
        Départ → destination
      </a>
    </div>
  )
}
