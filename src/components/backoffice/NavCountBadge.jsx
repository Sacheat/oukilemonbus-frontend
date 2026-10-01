import { useQueueCount } from '../../backoffice/useQueueCount'

// Nombre de demandes à traiter, à droite de « Réservations » dans la barre latérale (rien à 0)
export function NavCountBadge() {
  const { pendingCount } = useQueueCount()
  if (pendingCount === 0) return null
  return (
    <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-on-accent tabular-nums">
      <span className="sr-only">, </span>
      {pendingCount > 99 ? '99+' : pendingCount}
      <span className="sr-only"> à traiter</span>
    </span>
  )
}
