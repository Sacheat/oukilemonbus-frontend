import { useCallback, useState } from 'react'
import { fetchQueuePages } from '../lib/queue'
import { useApi } from './useApi'

// File des réservations pour une clé texte (queueRequestKey : file, période, organisation, recherche), avec
// « Charger plus ». Le nombre de pages lues revient à 1 quand la clé change (filtres modifiés).
// Renvoie useApi ({ data: { items, total, lastPage }, … }) plus `pageCount`, `canLoadMore` et `loadMore()`.
export function useQueue(requestKey) {
  const [pagination, setPagination] = useState({ key: requestKey, count: 1 })
  const pageCount = pagination.key === requestKey ? pagination.count : 1

  const fetchQueue = useCallback((signal) => fetchQueuePages(requestKey, pageCount, { signal }), [requestKey, pageCount])
  const queue = useApi(fetchQueue)

  const loadMore = useCallback(() => setPagination({ key: requestKey, count: pageCount + 1 }), [requestKey, pageCount])
  const canLoadMore = Boolean(queue.data) && pageCount < queue.data.lastPage

  return { ...queue, pageCount, canLoadMore, loadMore }
}
