import { useCallback, useState } from 'react'
import { getUnavailabilityHistory } from '../../api/unavailabilities'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../lib/dates'
import { historyChanges } from '../../lib/unavailabilities'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { Pagination } from '../ui/Pagination'

// Historique d'une indisponibilité (lecture seule, replié) : date, auteur, motif du changement, puis seulement les
// champs modifiés en « avant → après ». Lu par GET /unavailabilities/{id}/history, 15 entrées par page.
export function UnavailabilityHistory({ unavailabilityId }) {
  const [page, setPage] = useState(1)
  const fetchHistory = useCallback(
    (signal) => getUnavailabilityHistory(unavailabilityId, { page }, { signal }),
    [unavailabilityId, page],
  )
  const history = useApi(fetchHistory)
  const total = history.data?.meta?.total

  return (
    <details className="group border-t border-line pt-5">
      <summary className="flex min-h-11 cursor-pointer items-center font-bold">
        Historique{total !== undefined && <span className="ml-1.5 font-semibold text-muted">({total})</span>}
      </summary>
      <div className="mt-3 grid gap-3">
        {history.error ? (
          <ErrorState error={history.error} onRetry={history.reload} />
        ) : !history.data ? (
          <Loader />
        ) : history.data.data.length === 0 ? (
          <p className="text-sm text-muted">Aucune modification depuis la déclaration.</p>
        ) : (
          <>
            <ol className="grid gap-3">
              {history.data.data.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}
            </ol>
            <Pagination meta={history.data.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </details>
  )
}

function HistoryEntry({ entry }) {
  const changes = historyChanges(entry)
  return (
    <li className="rounded-control border border-line p-3 text-sm">
      <p className="text-muted">
        {formatDateTime(entry.created_at)}
        {entry.changed_by && <> · par {entry.changed_by.name}</>}
      </p>
      {entry.change_reason && <p className="mt-1 font-semibold">{entry.change_reason}</p>}
      {changes.length > 0 && (
        <dl className="mt-2 grid gap-1.5">
          {changes.map((change) => (
            <div key={change.label}>
              <dt className="text-xs font-bold tracking-wide text-muted uppercase">{change.label}</dt>
              <dd>
                <span className="text-muted line-through">{change.before}</span>
                <span aria-hidden="true"> → </span>
                <span className="sr-only"> remplacé par </span>
                {change.after}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}
