import { Skeleton } from '../ui/Skeleton'

// Squelette de la liste des récurrences : mêmes proportions que les cartes, pour éviter le saut au chargement
export function RecurrencesSkeleton({ count = 3 }) {
  return (
    <div role="status" className="grid gap-3.5">
      <span className="sr-only">Chargement des récurrences…</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex overflow-hidden rounded-card border border-line bg-surface">
          <Skeleton className="h-[170px] w-20 shrink-0 rounded-none" />
          <div className="grid flex-1 content-center gap-2.5 px-4.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="mt-1 h-2 w-full max-w-md" />
          </div>
        </div>
      ))}
    </div>
  )
}
