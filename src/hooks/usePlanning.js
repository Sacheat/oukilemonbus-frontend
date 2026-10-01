import { useCallback } from 'react'
import { getPlanning } from '../api/planning'
import { periodProblem, planningApiParams } from '../lib/planning'
import { useApi } from './useApi'

// Trajets du planning pour une clé texte (planningRequestKey : période et filtres), avec les disponibilités.
// Rechargement seulement quand la clé change. Période incorrecte : pas d'appel, `data` reste null.
export function usePlanning(requestKey) {
  const fetchPlanning = useCallback(
    (signal) => {
      const params = planningApiParams(requestKey, { withAvailability: true })
      if (periodProblem({ start: params.start_date, end: params.end_date })) return Promise.resolve(null)
      return getPlanning(params, { signal })
    },
    [requestKey],
  )
  return useApi(fetchPlanning)
}
