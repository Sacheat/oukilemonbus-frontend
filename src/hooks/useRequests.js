import { useCallback } from 'react'
import { getRequest, getRequests } from '../api/requests'
import { useApi } from './useApi'

// Page d'une file de demandes (`kind` : adhesion | creation) pour une clé texte (JSON des paramètres de l'API)
export function useRequests(kind, requestKey) {
  const fetchRequests = useCallback((signal) => getRequests(kind, JSON.parse(requestKey), { signal }), [kind, requestKey])
  return useApi(fetchRequests)
}

// Demande ouverte (relue par son identifiant) ; `requestId` null : rien à charger.
// `request` : la demande seulement si elle correspond à l'identifiant et à la file demandés.
export function useRequest(kind, requestId) {
  const fetchRequest = useCallback(
    (signal) => (requestId ? getRequest(kind, requestId, { signal }).then((data) => ({ kind, data })) : Promise.resolve(null)),
    [kind, requestId],
  )
  const result = useApi(fetchRequest)
  const loaded = result.data
  const id = loaded && (loaded.kind === 'adhesion' ? loaded.data.request_id : loaded.data.id)
  const request = loaded && loaded.kind === kind && String(id) === requestId ? loaded.data : null
  return { ...result, request }
}
