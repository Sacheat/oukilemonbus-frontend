import { useCallback } from 'react'
import { getUsers } from '../api/users'
import { GLOBAL_ROLES } from '../lib/users'
import { useApi } from './useApi'

// Nombre de comptes par rôle pour les pastilles du filtre, avec la même recherche et le même statut que la liste.
// `countKey` : JSON des paramètres sans rôle ni page. Un appel par rôle plus un pour « Tous » (meta.total, en
// parallèle) ; renvoie useApi ({ data: { all, admin, agent_communal, chauffeur, user } }).
export function useRoleCounts(countKey) {
  const fetchCounts = useCallback(
    async (signal) => {
      const params = JSON.parse(countKey)
      const roles = [null, ...GLOBAL_ROLES]
      const pages = await Promise.all(
        roles.map((role) => getUsers({ ...params, ...(role && { role }) }, { signal })),
      )
      return Object.fromEntries(roles.map((role, index) => [role ?? 'all', pages[index].meta.total]))
    },
    [countKey],
  )
  return useApi(fetchCounts)
}
