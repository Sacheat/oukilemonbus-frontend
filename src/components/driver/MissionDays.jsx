import { formatDate } from '../../lib/dates'
import { missionsByDay } from '../../lib/driverMissions'
import { reportOf } from '../../lib/tripReports'
import { MissionCard } from './MissionCard'

// Missions groupées par jour (titre du jour, puis les cartes ; deux colonnes sur grand écran si `columns`).
// `reports` : comptes rendus indexés par mission (useTripReports), absent tant qu'ils ne sont pas chargés.
export function MissionDays({ missions, columns = false, reports }) {
  return (
    <div className="grid gap-6">
      {missionsByDay(missions).map(({ day, missions: dayMissions }) => (
        <section key={day} aria-label={formatDate(day)} className="grid gap-2">
          <h3 className="text-sm font-bold first-letter:uppercase">{formatDate(day)}</h3>
          <div className={columns ? 'grid gap-3 md:grid-cols-2' : 'grid gap-3'}>
            {dayMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} report={reportOf(reports, mission.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
