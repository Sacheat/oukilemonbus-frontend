import { useCallback } from 'react'
import { getFailedJob, getFailedJobs } from '../api/tooling'
import { useApi } from './useApi'

// Page des jobs en échec pour une clé texte (JSON des paramètres de GET /queue/failed-jobs)
export function useFailedJobs(requestKey) {
  const fetchJobs = useCallback((signal) => getFailedJobs(JSON.parse(requestKey), { signal }), [requestKey])
  return useApi(fetchJobs)
}

// Job ouvert (exception complète, payload expurgé) ; `uuid` null : rien à charger.
// `job` : le détail seulement s'il correspond à l'uuid demandé.
export function useFailedJob(uuid) {
  const fetchJob = useCallback((signal) => (uuid ? getFailedJob(uuid, { signal }) : Promise.resolve(null)), [uuid])
  const result = useApi(fetchJob)
  const job = result.data && result.data.uuid === uuid ? result.data : null
  return { ...result, job }
}
