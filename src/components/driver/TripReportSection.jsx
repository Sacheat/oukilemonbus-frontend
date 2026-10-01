import { useCallback, useState } from 'react'
import { getTripReport } from '../../api/tripReports'
import { useApi } from '../../hooks/useApi'
import { formatLocalDateTime } from '../../lib/dates'
import { driverWindowState } from '../../lib/tripReports'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { TripReportForm } from './TripReportForm'
import { TripReportSummary } from './TripReportSummary'

// Compte rendu dans le détail d'une mission (cahier des charges §3), seulement pour un trajet confirmé :
//   avant l'heure de départ         → « vous pourrez confirmer à partir du … »
//   pendant la fenêtre              → formulaire, ou compte rendu + « Modifier » (attendu le jour même,
//                                     possible jusqu'au lendemain 12:00)
//   après la fenêtre                → compte rendu en lecture, ou « délai dépassé : contactez un agent »
export function TripReportSection({ mission }) {
  const fetchReport = useCallback((signal) => getTripReport(mission.id, { signal }), [mission.id])
  const tripReport = useApi(fetchReport)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState(null)

  if (mission.status !== 'confirme') return null

  let content
  if (tripReport.error) content = <ErrorState error={tripReport.error} onRetry={tripReport.reload} />
  else if (!tripReport.data) content = <Loader />
  else {
    const { data: report, meta } = tripReport.data
    const windowState = driverWindowState(meta)

    function handleSaved() {
      setEditing(false)
      setNotice('Compte rendu enregistré. Merci.')
      tripReport.reload()
    }

    if (windowState === 'avant') {
      content = (
        <Alert>Vous pourrez confirmer ce trajet à partir du {formatLocalDateTime(meta.driver_window_opens_at)}.</Alert>
      )
    } else if (meta.can_submit && (!report || editing)) {
      content = (
        <TripReportForm
          mission={mission}
          report={report}
          onSaved={handleSaved}
          onCancel={report ? () => setEditing(false) : null}
        />
      )
    } else if (report) {
      content = (
        <>
          <TripReportSummary report={report} />
          {meta.can_submit ? (
            <div>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Modifier le compte rendu
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">Le délai de modification est dépassé : pour une correction, contactez un agent.</p>
          )}
        </>
      )
    } else {
      content = (
        <Alert tone="warning">
          Le délai pour confirmer ce trajet (le lendemain à 12:00) est dépassé : contactez un agent.
        </Alert>
      )
    }
  }

  return (
    <section aria-labelledby="mission-compte-rendu" className="grid gap-3 rounded-card border border-line bg-surface p-4">
      <h2 id="mission-compte-rendu" className="text-lg font-bold">Compte rendu du trajet</h2>
      {notice && <Alert tone="success">{notice}</Alert>}
      {content}
    </section>
  )
}
