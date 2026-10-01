import { tripReportBadge } from '../../lib/tripReports'
import { Badge } from '../ui/Badge'

// Réalisé, Non réalisé ou À confirmer (trajet confirmé et commencé, sans compte rendu) ; rien sinon
export function TripReportBadge({ report, mission }) {
  const badge = tripReportBadge(report, mission)
  if (!badge) return null
  return <Badge tone={badge.tone}>{badge.label}</Badge>
}
