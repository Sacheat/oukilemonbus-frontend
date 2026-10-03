import { useCallback } from 'react'
import { getInspectorEntries } from '../api/tooling'
import { useApi } from './useApi'

// Page du journal de l'Inspector pour une clé texte (JSON des paramètres de GET /inspector/entries).
// Rechargement seulement quand la clé change.
export function useInspectorEntries(requestKey) {
  const fetchEntries = useCallback((signal) => getInspectorEntries(JSON.parse(requestKey), { signal }), [requestKey])
  return useApi(fetchEntries)
}
