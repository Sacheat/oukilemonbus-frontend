import { useCallback } from 'react'
import { getInspectorUser } from '../api/tooling'
import { useApi } from './useApi'

// Fiche de diagnostic d'un compte (Inspector) ; `userId` null : rien à charger.
// `sheet` : la fiche seulement si elle correspond à l'id demandé.
export function useInspectorUser(userId) {
  const fetchSheet = useCallback((signal) => (userId ? getInspectorUser(userId, { signal }) : Promise.resolve(null)), [userId])
  const result = useApi(fetchSheet)
  const sheet = result.data && String(result.data.id) === userId ? result.data : null
  return { ...result, sheet }
}
