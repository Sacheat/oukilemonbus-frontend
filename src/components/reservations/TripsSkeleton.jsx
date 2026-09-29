import { Skeleton } from '../ui/Skeleton'

// Squelette de la liste « Mes déplacements » : mêmes proportions que les cartes, pour éviter le saut au chargement
export function TripsSkeleton({ count = 4 }) {
  return (
    <div role="status" className="grid gap-3">
      <span className="sr-only">Chargement des déplacements…</span>
      <Skeleton className="mb-1 h-4 w-32" />
      <div className="grid gap-3 border-l-2 border-line-strong pl-7">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex overflow-hidden rounded-card border border-line bg-surface">
            <Skeleton className="h-[106px] w-16 shrink-0 rounded-none" />
            <div className="grid flex-1 content-center gap-2.5 px-4.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
