import { formatUtcRange } from '../../lib/dates'
import { REASON_TYPE_LABELS } from '../../lib/unavailabilities'
import { DetailList } from '../ui/DetailList'

// Détail en lecture seule : ce qui est concerné, la période (heure de Bruxelles) et le motif
export function UnavailabilityDetails({ unavailability, subject }) {
  return (
    <DetailList
      items={[
        ['Concerne', `${REASON_TYPE_LABELS[unavailability.reason_type]} · ${subject}`],
        ['Période', formatUtcRange(unavailability.start_datetime, unavailability.end_datetime)],
        unavailability.reason && ['Motif', unavailability.reason],
      ]}
    />
  )
}
