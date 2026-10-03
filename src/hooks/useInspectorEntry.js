import { useCallback } from 'react'
import { getInspectorEntry } from '../api/tooling'
import { useApi } from './useApi'

// Entrée du journal ouverte (avec la fiche complète de son flow) ; `entryId` null : rien à charger.
// `entry` : l'entrée seulement si elle correspond à l'id demandé (pas l'ancienne pendant un changement).
export function useInspectorEntry(entryId) {
  const fetchEntry = useCallback((signal) => (entryId ? getInspectorEntry(entryId, { signal }) : Promise.resolve(null)), [entryId])
  const result = useApi(fetchEntry)
  const entry = result.data && String(result.data.id) === entryId ? result.data : null
  return { ...result, entry }
}
