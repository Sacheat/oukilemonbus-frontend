import { CheckCircle2 } from 'lucide-react'
import { countLabel, splitTiles, TILE_SHORT_LABELS } from '../../lib/dashboard'
import { Skeleton } from '../ui/Skeleton'
import { StatTile } from '../home/StatTile'

// Section « À traiter » : les compteurs non nuls en tuiles, ceux à zéro repliés en une ligne discrète,
// « Tout est à jour » quand il n'y a rien. `toProcess` undefined : chargement. `can` : liens selon la permission.
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

  const { active, empty } = splitTiles(toProcess)

  if (active.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 text-sm shadow-soft">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <span>
          <strong className="block">Tout est à jour</strong>
          <span className="text-muted">Aucune demande, aucun conflit ni aucune affectation en attente.</span>
        </span>
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {active.map((tile) => (
          <StatTile
            key={tile.key}
            to={tile.to && can(tile.permission) ? tile.to : undefined}
            icon={tile.icon}
            tone={tile.tone}
            value={toProcess[tile.key]}
            label={countLabel(toProcess[tile.key], tile.labels)}
          />
        ))}
      </div>
      {empty.length > 0 && (
        <p className="flex items-start gap-2 text-sm text-muted">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <span>
            Rien en attente : {empty.map((tile) => TILE_SHORT_LABELS[tile.key]).join(', ')}.
          </span>
        </p>
      )}
    </div>
  )
}
