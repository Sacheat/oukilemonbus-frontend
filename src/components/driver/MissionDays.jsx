import { formatDate } from '../../lib/dates'
import { missionsByDay } from '../../lib/driverMissions'
import { reportOf } from '../../lib/tripReports'
import { MissionRow } from './MissionRow'

// Missions groupées par jour : titre du jour, puis une liste de lignes compactes.
// `reports` : comptes rendus indexés par mission, absent tant qu'ils ne sont pas connus (pas de badge).
export function MissionDays({ missions, reports }) {
  return (
    <div className="grid gap-5">
      {missionsByDay(missions).map(({ day, missions: dayMissions }) => (
        <section key={day} aria-label={formatDate(day)} className="grid gap-2">
          <h3 className="text-sm font-bold first-letter:uppercase">{formatDate(day)}</h3>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {dayMissions.map((mission) => (
              <MissionRow key={mission.id} mission={mission} report={reportOf(reports, mission.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
