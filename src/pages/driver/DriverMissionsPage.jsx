import { useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { MissionsResults } from '../../components/driver/MissionsResults'
import { PendingReports } from '../../components/driver/PendingReports'
import { PageHeader } from '../../components/ui/PageHeader'
import { useDriverMissions } from '../../hooks/useDriverMissions'
import { useTripReports } from '../../hooks/useTripReports'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { DEFAULT_MISSION_PERIOD, MISSION_PERIODS, readMissionSearch } from '../../lib/driverMissions'
import { todayInBrussels } from '../../lib/planning'

// Accueil de l'espace chauffeur : ses missions (le backend ne renvoie que les siennes).
// Onglets ?periode= (à venir par défaut, passées) et ?page=. Pensé pour le téléphone, adapté au grand écran.
export function DriverMissionsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { period, page } = readMissionSearch(searchParams)
  const today = todayInBrussels()
  const missions = useDriverMissions(period, page, today)
  // Comptes rendus des missions affichées (badges « À confirmer », « Réalisé »…), 15 au plus
  const missionIds = (missions.data?.data ?? []).map((mission) => mission.id).join(',')
  const reports = useTripReports(missionIds)

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
      <PageHeader
        eyebrow="Mes missions"
        title={`Bonjour ${user.first_name}`}
        description={<span className="first-letter:uppercase">{formatDate(today)}</span>}
      />

      <PendingReports />

      <div role="group" aria-label="Période" className="flex w-fit rounded-control border border-line-strong bg-surface p-1">
        {MISSION_PERIODS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={period === option.value}
            onClick={() => updateSearch({ periode: option.value === DEFAULT_MISSION_PERIOD ? null : option.value, page: null })}
            className={cx(
              'min-h-11 rounded-md px-4 text-sm font-semibold',
              period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <MissionsResults
        missions={missions}
        reports={reports.data}
        period={period}
        page={page}
        today={today}
        onPageChange={(nextPage) => updateSearch({ page: nextPage > 1 ? String(nextPage) : null })}
      />
    </div>
  )
}
