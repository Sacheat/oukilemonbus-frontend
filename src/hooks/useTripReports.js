import { useCallback } from 'react'
import { getTripReports } from '../api/tripReports'
import { reportsByReservation } from '../lib/tripReports'
import { useApi } from './useApi'

// Comptes rendus des réservations affichées (badges), indexés par reservation_id.
// `idsKey` : identifiants séparés par des virgules (valeur simple : rechargement seulement si la liste change).
// Pas d'identifiants : aucun appel. En cas d'erreur, les badges ne s'affichent simplement pas.
export function useTripReports(idsKey) {
  const fetchReports = useCallback(
    (signal) => {
      const ids = idsKey ? idsKey.split(',').map(Number) : []
      if (ids.length === 0) return Promise.resolve({})
      return getTripReports(ids, { signal }).then(reportsByReservation)
    },
    [idsKey],
  )
  return useApi(fetchReports)
}
