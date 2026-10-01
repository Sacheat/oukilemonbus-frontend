import { CalendarDays } from 'lucide-react'
import { Alert } from '../ui/Alert'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { PlanningList } from './PlanningList'
import { PlanningWeek } from './PlanningWeek'

// Zone des trajets selon la situation :
//   période incorrecte → message (aucun appel au backend)
//   erreur             → message et « Réessayer »
//   chargement         → indicateur
//   vue semaine        → 5 colonnes, même vides
//   vue liste          → jours qui ont des trajets, ou « Aucun trajet »
export function PlanningResults({ problem, planning, view, weekStart, tripsGroupedByDay, today, onOpenTrip, reports }) {
  if (problem) return <Alert tone="warning">{problem}</Alert>
  if (planning.error) return <ErrorState error={planning.error} onRetry={planning.reload} />

  const tripList = planning.data?.data
  if (!tripList) return <Loader />

  if (view === 'semaine') {
    return <PlanningWeek weekStart={weekStart} tripsGroupedByDay={tripsGroupedByDay} today={today} onOpenTrip={onOpenTrip} reports={reports} />
  }
  if (tripList.length === 0) return <EmptyState icon={CalendarDays} title="Aucun trajet sur cette période" />
  return <PlanningList tripsGroupedByDay={tripsGroupedByDay} today={today} onOpenTrip={onOpenTrip} reports={reports} />
}
