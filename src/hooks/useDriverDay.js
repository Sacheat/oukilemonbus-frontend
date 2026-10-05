import { useCallback } from 'react'
import { fetchAllPages } from '../api/pagination'
import { getReservations } from '../api/reservations'
import { getTripProgressList } from '../api/tripProgress'
import { dayMissionsParams, neighbourDayParams, progressByReservation } from '../lib/driverJourney'
import { useApi } from './useApi'

// Missions d'un jour du chauffeur (le backend ne renvoie que les siennes) et leur avancement, en deux requêtes,
// plus les jours voisins qui ont des missions (flèches ← →). `day` (texte) : rechargement seulement s'il change.
// Pendant un chargement, `data` vaut undefined : pas de missions d'un autre jour affichées un instant.
export function useDriverDay(day) {
  const fetchDay = useCallback(
    async (signal) => {
      const [missionList, previous, next] = await Promise.all([
        fetchAllPages((page) => getReservations({ ...dayMissionsParams(day), page }, { signal }), { signal, maxPages: 3 }),
        getReservations({ ...neighbourDayParams(day, 'previous'), page: 1 }, { signal }),
        getReservations({ ...neighbourDayParams(day, 'next'), page: 1 }, { signal }),
      ])
      const ids = missionList.map((mission) => mission.id)
      const progressList = ids.length > 0 ? await getTripProgressList(ids, { signal }) : []
      return {
        missionList,
        progressMap: progressByReservation(progressList),
        previousDay: previous.data[0]?.trip_date?.slice(0, 10) ?? null,
        nextDay: next.data[0]?.trip_date?.slice(0, 10) ?? null,
      }
    },
    [day],
  )
  const result = useApi(fetchDay)
  return { ...result, data: result.loading ? undefined : result.data }
}
