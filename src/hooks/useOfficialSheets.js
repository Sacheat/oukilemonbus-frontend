import { useCallback } from 'react'
import { getRouteSheets } from '../api/routeSheets'
import { weekEndOf } from '../lib/routeSheets'
import { useApi } from './useApi'

// Feuilles officielles (par véhicule) d'une semaine, une page à la fois (15 par page, filtrées par le backend).
// `weekStart` et `page` sont des valeurs simples : rechargement seulement quand l'une change.
export function useOfficialSheets(weekStart, page) {
  const fetchSheets = useCallback(
    (signal) => getRouteSheets({ date_from: weekStart, date_to: weekEndOf(weekStart), page }, { signal }),
    [weekStart, page],
  )
  const sheets = useApi(fetchSheets)
  return { ...sheets, data: sheets.loading ? undefined : sheets.data }
}
