import { useCallback } from 'react'
import { getDriverDay } from '../api/driverJourney'
import { progressByReservation } from '../lib/driverJourney'
import { useApi } from './useApi'
import { useAutoRefresh } from './useAutoRefresh'

// Un jour de « Ma journée » en un appel (GET /driver-journey/day) : missions, avancement, jours voisins qui ont des
// missions (flèches ← →) et réglages (application de navigation). Relu toutes les 60 s et au retour sur l'onglet, pour
// voir un trajet annulé ou modifié par un agent. `day` (texte) : nouveau chargement seulement s'il change.
// `data` vaut undefined tant que le jour affiché n'est pas chargé (pas de missions d'un autre jour un instant) ; pendant
// un rafraîchissement du même jour, il garde la journée affichée.
export function useDriverDay(day) {
  const fetchDay = useCallback(
    async (signal) => {
      const result = await getDriverDay(day, { signal })
      return {
        day,
        missionList: result.missions,
        progressMap: progressByReservation(result.progress),
        previousDay: result.previous_day,
        nextDay: result.next_day,
        settings: result.settings,
      }
    },
    [day],
  )
  const result = useApi(fetchDay)
  useAutoRefresh(result.reload)
  return { ...result, data: result.data?.day === day ? result.data : undefined }
}
