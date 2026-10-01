import { tripReportBadge } from '../../lib/tripReports'
import { Badge } from '../ui/Badge'

// Réalisé, Non réalisé, À confirmer, ou (agent, délai du chauffeur dépassé) Sans compte rendu ; rien sinon.
// `report` : undefined tant que les comptes rendus ne sont pas chargés (aucun badge), null s'il n'y en a pas.
export function TripReportBadge({ report, mission, audience = 'chauffeur' }) {
  const badge = tripReportBadge(report, mission, audience)
  if (!badge) return null
  return <Badge tone={badge.tone}>{badge.label}</Badge>
}
