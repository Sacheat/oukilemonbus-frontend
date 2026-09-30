import { cx } from '../../lib/cx'
import { RESERVATION_STATUS_LABELS, statusCountLabel } from '../../lib/labels'
import { STATUS_DOTS } from '../../lib/trips'

// Ordre d'affichage : ce qui roule d'abord, ce qui est écarté à la fin
const ORDER = ['confirme', 'approuve', 'en_attente', 'en_conflit', 'refuse', 'annule']

// Répartition des trajets d'une série par statut (`counts` = status_counts du backend) :
// barre empilée aux couleurs des statuts, puis la légende « 28 confirmés · 2 annulés ».
export function StatusMix({ counts, className }) {
  const entries = ORDER.map((status) => [status, counts?.[status] ?? 0]).filter(([, count]) => count > 0)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  if (total === 0) return null

  return (
    <div className={className}>
      <div aria-hidden="true" className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-line">
        {entries.map(([status, count]) => (
          <span key={status} className={cx('h-full', STATUS_DOTS[status])} style={{ width: `${(count / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
        {entries.map(([status, count]) => (
          <li key={status} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={cx('size-2 rounded-full', STATUS_DOTS[status])} />
            <span className="sr-only">{RESERVATION_STATUS_LABELS[status]} : </span>
            {statusCountLabel(status, count)}
          </li>
        ))}
      </ul>
    </div>
  )
}
