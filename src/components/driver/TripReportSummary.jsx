import { formatDateTime } from '../../lib/dates'
import { Badge } from '../ui/Badge'
import { DetailList } from '../ui/DetailList'

// Compte rendu enregistré, en lecture : résultat, qui l'a rempli et quand, heures et passagers réels, remarque.
//   rempli par le chauffeur du trajet → « Déclaré par … » ; par un agent ou un admin → « Saisi par … »
export function TripReportSummary({ report }) {
  const realised = report.outcome === 'realise'
  const passengerCount = (report.actual_nb_children ?? 0) + (report.actual_nb_adults ?? 0)

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={realised ? 'success' : 'danger'}>{report.outcome_label}</Badge>
        <span className="text-sm text-muted">{reportedByText(report)}</span>
      </div>
      <DetailList
        items={[
          realised && ['Horaires réels', `${report.actual_departure_time} → ${report.actual_return_time}`],
          realised && [
            'Passagers réels',
            `${passengerCount} (${report.actual_nb_children} enfants, ${report.actual_nb_adults} adultes)`,
          ],
          report.remarks && [realised ? 'Remarque' : 'Motif', report.remarks],
        ]}
      />
    </div>
  )
}

function reportedByText(report) {
  const date = formatDateTime(report.reported_at)
  if (!report.reported_by_name) return `déclaré le ${date}`
  return `${report.reported_by_driver ? 'Déclaré' : 'Saisi'} par ${report.reported_by_name} le ${date}`
}
