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

// Contenu de la section « Compte rendu du trajet » d'une mission confirmée :
//   avant l'heure de départ         → « vous pourrez confirmer à partir du … »
//   pendant la fenêtre              → formulaire, ou compte rendu + « Modifier » (attendu le jour même,
//                                     possible jusqu'au lendemain 12:00)
//   après la fenêtre                → compte rendu en lecture, ou « délai dépassé : contactez un agent »
export function TripReportPanel({ mission }) {
  const fetchReport = useCallback((signal) => getTripReport(mission.id, { signal }), [mission.id])
  const tripReport = useApi(fetchReport)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState(null)

  if (tripReport.error) return <ErrorState error={tripReport.error} onRetry={tripReport.reload} />
  if (!tripReport.data) return <Loader />

  const { data: report, meta } = tripReport.data
  const windowState = driverWindowState(meta)

  function handleSaved() {
    setEditing(false)
    setNotice('Compte rendu enregistré. Merci.')
    tripReport.reload()
  }

  // Le message de l'enregistrement précédent disparaît quand on modifie à nouveau
  function startEditing() {
    setNotice(null)
    setEditing(true)
  }

  let content
  if (windowState === 'avant') {
    content = <Alert>Vous pourrez confirmer ce trajet à partir du {formatLocalDateTime(meta.driver_window_opens_at)}.</Alert>
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
            <Button variant="secondary" onClick={startEditing}>
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
      <Alert tone="warning">Le délai pour confirmer ce trajet (le lendemain à 12:00) est dépassé : contactez un agent.</Alert>
    )
  }

  return (
    <>
      {notice && <Alert tone="success">{notice}</Alert>}
      {content}
    </>
  )
}
