import { formatDate } from '../../lib/dates'
import { DECISION_STATUS } from '../../lib/documents'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

// Décision déjà prise (onglets « Approuvées » et « Refusées »), cliquable pour ouvrir le panneau de la réservation
export function CollegeDecisionRow({ decision, onOpen }) {
  const reservation = decision.reservation
  const status = DECISION_STATUS[decision.decision_status]

  return (
    <Card
      as="button"
      type="button"
      onClick={() => onOpen(decision.reservation_id)}
      className="w-full text-left transition hover:border-line-strong hover:bg-surface-muted"
    >
      <span className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-bold">{reservation?.organization?.name ?? `Réservation n° ${decision.reservation_id}`}</span>
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
      </span>
      {reservation?.trip_date && (
        <span className="mt-1 block text-sm first-letter:uppercase">Trajet du {formatDate(reservation.trip_date)}</span>
      )}
      <span className="mt-1 block text-sm text-muted">
        {decision.decision_date ? `Séance du ${formatDate(decision.decision_date, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Date de séance non renseignée'}
        {decision.decision_reference && ` · réf. ${decision.decision_reference}`}
        {` · réservation n° ${decision.reservation_id}`}
      </span>
    </Card>
  )
}
