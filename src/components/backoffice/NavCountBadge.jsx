import { useQueueCount } from '../../backoffice/useQueueCount'
import { cx } from '../../lib/cx'
import { NAV_COUNTS } from '../../lib/navCounts'

// Compteur à droite d'une entrée de la barre latérale (`name` : clé de NAV_COUNTS), rien à 0 ou pas encore chargé.
// Rouge pour un compteur urgent (demandes d'aide), jaune sinon.
export function NavCountBadge({ name }) {
  const { counts } = useQueueCount()
  const count = counts[name] ?? 0
  if (count === 0) return null
  return (
    <span
      className={cx(
        'ml-auto rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
        NAV_COUNTS[name].urgent ? 'bg-danger text-on-danger' : 'bg-accent text-on-accent',
      )}
    >
      <span className="sr-only">, </span>
      {count > 99 ? '99+' : count}
      <span className="sr-only"> {NAV_COUNTS[name].sr}</span>
    </span>
  )
}
