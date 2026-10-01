import { formatLocalPeriod } from '../../lib/dates'
import { isOngoing } from '../../lib/unavailabilities'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

// Une indisponibilité du chauffeur (lecture seule) : période en heure locale, motif, badge « En cours »
export function DriverUnavailabilityRow({ unavailability }) {
  return (
    <Card className="grid gap-1">
      <span className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-bold first-letter:uppercase">
          {formatLocalPeriod(unavailability.start_datetime, unavailability.end_datetime)}
        </span>
        {isOngoing(unavailability) && <Badge tone="warning">En cours</Badge>}
      </span>
      <span className="text-sm break-words text-muted">{unavailability.reason ?? 'Motif non précisé'}</span>
    </Card>
  )
}
