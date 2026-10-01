import { CircleCheck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { getUser } from '../../api/users'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../lib/dates'

// Historique repliable des conflits déjà résolus : type, message, par qui et quand. Les noms des agents sont
// chargés à l'ouverture seulement (rien n'est demandé tant que l'historique reste replié).
export function ResolvedConflicts({ conflicts }) {
  const [open, setOpen] = useState(false)
  if (conflicts.length === 0) return null
  return (
    <details className="rounded-card border border-line" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3.5 text-sm font-semibold">
        <CircleCheck className="size-4 text-success" aria-hidden="true" />
        {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} résolu{conflicts.length > 1 ? 's' : ''}
      </summary>
      {open && <ResolvedList conflicts={conflicts} />}
    </details>
  )
}

function ResolvedList({ conflicts }) {
  const ids = [...new Set(conflicts.map((conflict) => conflict.resolved_by_user_id).filter(Boolean))].join(',')
  const fetchNames = useCallback(
    async (signal) => {
      const users = await Promise.all(ids.split(',').filter(Boolean).map((id) => getUser(Number(id), { signal }).catch(() => null)))
      return Object.fromEntries(users.filter(Boolean).map((user) => [user.id, user.full_name]))
    },
    [ids],
  )
  const names = useApi(fetchNames).data ?? {}

  return (
    <ul className="grid gap-2 border-t border-line px-3.5 py-3 text-sm">
      {conflicts.map((conflict) => (
        <li key={conflict.id}>
          <strong className="block">{conflict.type_label}</strong>
          <span className="block text-muted">{conflict.message}</span>
          <span className="block text-xs text-muted">
            Résolu
            {conflict.resolved_at && ` le ${formatDateTime(conflict.resolved_at)}`}
            {conflict.resolved_by_user_id && ` par ${names[conflict.resolved_by_user_id] ?? '…'}`}
          </span>
        </li>
      ))}
    </ul>
  )
}
