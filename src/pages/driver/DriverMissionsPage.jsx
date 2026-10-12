import { useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { MissionsResults } from '../../components/driver/MissionsResults'
import { DriverHero } from '../../components/driver/DriverHero'
import { PendingReports } from '../../components/driver/PendingReports'
import { useDriverMissions } from '../../hooks/useDriverMissions'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { formatDate } from '../../lib/dates'
import { DEFAULT_MISSION_PERIOD, MISSION_PERIODS, readMissionSearch } from '../../lib/driverMissions'
import { todayInBrussels } from '../../lib/planning'
import { reportsFromMissions } from '../../lib/tripReports'

// Accueil de l'espace chauffeur : bannière avec le bouton jaune « Ma journée », puis ses missions (le backend ne
// renvoie que les siennes).
// Onglets ?periode= (à venir par défaut, passées) et ?page=. Pensé pour le téléphone, adapté au grand écran.
// Deux appels : la page de missions (compte rendu joint) et les comptes rendus à faire.
export function DriverMissionsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { period, page } = readMissionSearch(searchParams)
  const today = todayInBrussels()
  const missions = useDriverMissions(period, page, today)
  // Comptes rendus joints aux missions (badges « À confirmer », « Réalisé »…)
  const reports = reportsFromMissions(missions.data?.data)
  // Missions du jour, connues sur la première page de « À venir » (triée du plus proche au plus lointain)
  const todayCount =
    period === 'a-venir' && page === 1 && missions.data
      ? missions.data.data.filter((mission) => mission.trip_date.slice(0, 10) === today).length
      : undefined

  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value)
      else next.delete(name)
    })
    setSearchParams(next)
  }

  return (
    <div className="grid gap-6">
      <DriverHero firstName={user.first_name} todayLabel={formatDate(today)} todayCount={todayCount} />

      <PendingReports />

      <SegmentedControl
        label="Période"
        options={MISSION_PERIODS}
        value={period}
        onChange={(value) => updateSearch({ periode: value === DEFAULT_MISSION_PERIOD ? null : value, page: null })}
        className="w-fit"
      />

      <MissionsResults
        missions={missions}
        reports={reports}
        period={period}
        page={page}
        today={today}
        onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })}
      />
    </div>
  )
}
