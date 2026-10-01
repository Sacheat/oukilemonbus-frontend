import { useCallback } from 'react'
import { getTripReports } from '../api/tripReports'
import { reportsByReservation } from '../lib/tripReports'
import { useApi } from './useApi'

// Comptes rendus des réservations affichées (badges), indexés par reservation_id.
// `idsKey` : identifiants séparés par des virgules (valeur simple : rechargement seulement si la liste change).
// Pas d'identifiants : aucun appel. `data` reste undefined tant que l'index ne correspond pas à `idsKey`
// (premier chargement, autre page, erreur) : pas de badge « À confirmer » faute de données. Un `reload()` garde
// l'index affiché jusqu'à la réponse.
export function useTripReports(idsKey) {
  const fetchReports = useCallback(
    (signal) => {
      const ids = idsKey ? idsKey.split(',').map(Number) : []
      if (ids.length === 0) return Promise.resolve({ idsKey, reports: {} })
      return getTripReports(ids, { signal }).then((reportList) => ({ idsKey, reports: reportsByReservation(reportList) }))
    },
    [idsKey],
  )
  const result = useApi(fetchReports)
  return { ...result, data: result.data?.idsKey === idsKey ? result.data.reports : undefined }
}
