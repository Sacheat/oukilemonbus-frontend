import { useState } from 'react'
import { TripReportSummary } from '../driver/TripReportSummary'
import { Button } from '../ui/Button'
import { PlanningReportEditor } from './PlanningReportEditor'

// Compte rendu d'un trajet commencé, dans le panneau du Planning :
//   lecture seule (sans trip-reports.manage)  → compte rendu, ou « Pas encore de compte rendu »
//   agent / admin, pas de compte rendu         → « Saisir le compte rendu » (rattrapage, sans délai)
//   agent / admin, compte rendu existant       → compte rendu + « Corriger »
// Le formulaire est celui du chauffeur ; le backend vérifie les règles (trajet confirmé et commencé).
export function PlanningTripReport({ trip, report, canManage, onSaved }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <PlanningReportEditor
        reservationId={trip.reservation_id}
        report={report}
        onSaved={onSaved}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="grid gap-3">
      {report ? <TripReportSummary report={report} /> : <p className="text-sm text-muted">Pas encore de compte rendu.</p>}
      {canManage && (
        <div>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {report ? 'Corriger le compte rendu' : 'Saisir le compte rendu'}
          </Button>
        </div>
      )}
    </div>
  )
}
