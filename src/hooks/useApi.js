import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

// Charge des données au montage et quand `fetcher` change.
// `fetcher` reçoit un AbortSignal et renvoie une promesse des données ;
// le mémoriser avec useCallback pour ne pas recharger à chaque rendu :
//   const fetchReservations = useCallback((signal) => getReservations({ page }, { signal }), [page])
//   const { data, error, loading, reload } = useApi(fetchReservations)
// Pendant un rechargement, `data` garde la valeur précédente.
export function useApi(fetcher) {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState({ fetcher: null, reloadCount: -1, data: undefined, error: null })

  useEffect(() => {
    const controller = new AbortController()
    fetcher(controller.signal)
      .then((data) => setResult({ fetcher, reloadCount, data, error: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return
        setResult((previous) => ({ fetcher, reloadCount, data: previous.data, error }))
      })
    return () => controller.abort()
  }, [fetcher, reloadCount])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  const loading = result.fetcher !== fetcher || result.reloadCount !== reloadCount

  return { data: result.data, error: result.error, loading, reload }
}
