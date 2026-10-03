import { useCallback } from 'react'
import { getUsers } from '../api/users'
import { useApi } from './useApi'

// Page de comptes pour une clé texte (JSON des paramètres de GET /users : recherche, filtres, page).
// Rechargement seulement quand la clé change.
export function useUsers(requestKey) {
  const fetchUsers = useCallback((signal) => getUsers(JSON.parse(requestKey), { signal }), [requestKey])
  return useApi(fetchUsers)
}
