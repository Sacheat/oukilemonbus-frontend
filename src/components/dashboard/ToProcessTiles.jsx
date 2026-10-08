import { CheckCircle2 } from 'lucide-react'
import { activeTiles, countLabel } from '../../lib/dashboard'
import { Skeleton } from '../ui/Skeleton'
import { StatTile } from '../home/StatTile'

// Section « À faire » : uniquement ce sur quoi l'agent peut agir, en tuiles qui disent l'action (« 2 réservations à
// valider ») et ouvrent la liste où le faire. Compteurs à zéro masqués ; « Tout est à jour » quand il n'y a rien.
// `toProcess` undefined : chargement. `can` : liens selon la permission.
export function ToProcessTiles({ toProcess, can }) {
  if (!toProcess) {
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[78px] rounded-card" />
        ))}
      </div>
    )
  }

  const tiles = activeTiles(toProcess)

  if (tiles.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 text-sm shadow-soft">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <span>
          <strong className="block">Tout est à jour</strong>
          <span className="text-muted">Aucune réservation, aucun conflit ni aucune demande en attente.</span>
        </span>
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <StatTile
          key={tile.key}
          to={can(tile.permission) ? tile.to : undefined}
          icon={tile.icon}
          tone={tile.tone}
          value={toProcess[tile.key]}
          label={countLabel(toProcess[tile.key], tile.labels)}
        />
      ))}
    </div>
  )
}
