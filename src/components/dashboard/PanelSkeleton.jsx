import { Skeleton } from '../ui/Skeleton'

// Chargement d'un panneau du tableau de bord : quelques lignes grises
export function PanelSkeleton({ rows = 3 }) {
  return (
    <div className="grid gap-4 px-5 py-5" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
