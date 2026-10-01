import { CalendarCheck, Route } from 'lucide-react'
import { reportOf } from '../../lib/tripReports'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { Pagination } from '../ui/Pagination'
import { MissionCard } from './MissionCard'
import { MissionDays } from './MissionDays'

// Zone des missions selon la situation :
//   erreur ou chargement           → message ou indicateur
//   « À venir », première page     → « Aujourd'hui » mis en avant (colonne de gauche sur grand écran),
//                                     puis les prochains jours (colonne de droite)
//   autre page ou « Passées »      → missions groupées par jour
// `reports` : comptes rendus indexés par mission (badges), absent tant qu'ils ne sont pas chargés
export function MissionsResults({ missions, reports, period, page, today, onPageChange }) {
  if (missions.error) return <ErrorState error={missions.error} onRetry={missions.reload} />
  const missionList = missions.data?.data
  if (!missionList) return <Loader />

  const pagination = <Pagination meta={missions.data.meta} onPageChange={onPageChange} />

  if (period === 'passees' || page > 1) {
    if (missionList.length === 0) {
      return <EmptyState icon={Route} title={period === 'passees' ? 'Aucune mission passée' : 'Aucune autre mission à venir'} />
    }
    return (
      <div className="grid gap-6">
        <MissionDays missions={missionList} columns reports={reports} />
        {pagination}
      </div>
    )
  }

  const todayMissions = missionList.filter((mission) => mission.trip_date === today)
  const laterMissions = missionList.filter((mission) => mission.trip_date !== today)

  return (
    <div className="grid gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-labelledby="missions-today" className="grid gap-3 lg:sticky lg:top-6">
          <h2 id="missions-today" className="text-lg font-bold">Aujourd'hui</h2>
          {todayMissions.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="Aucune mission aujourd'hui" />
          ) : (
            todayMissions.map((mission) => <MissionCard key={mission.id} mission={mission} large report={reportOf(reports, mission.id)} />)
          )}
        </section>

        <section aria-labelledby="missions-later" className="grid gap-3">
          <h2 id="missions-later" className="text-lg font-bold">Prochaines missions</h2>
          {laterMissions.length === 0 ? (
            <EmptyState icon={Route} title="Aucune autre mission prévue" />
          ) : (
            <MissionDays missions={laterMissions} reports={reports} />
          )}
        </section>
      </div>
      {pagination}
    </div>
  )
}
