import { useCallback, useState } from 'react'
import { getCouncilDecisions } from '../../api/documents'
import { getReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatTime } from '../../lib/dates'
import { decisionEditMode } from '../../lib/councilDecisions'
import { DECISION_STATUS } from '../../lib/documents'
import { todayInBrussels } from '../../lib/planning'
import { shortAddress } from '../../lib/reservations'
import { TripDocumentsCard } from '../documents/TripDocumentsCard'
import { Badge } from '../ui/Badge'
import { DetailList } from '../ui/DetailList'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { StatusBadge } from '../ui/StatusBadge'
import { DecisionSection } from './DecisionSection'
import { RegenerateDeliberation } from './RegenerateDeliberation'

// Panneau d'une réservation soumise au Collège : résumé, décision (DecisionSection selon decisionEditMode :
// formulaire complet, notes seulement pour un trajet passé, ou lecture seule), délibération et documents.
export function CollegeDrawerContent({ reservationId, onSaved }) {
  const { can } = useAuth()
  const [documentsVersion, setDocumentsVersion] = useState(0) // relit les documents après une régénération

  const fetchDetail = useCallback(
    async (signal) => {
      const [reservation, decisions] = await Promise.all([
        getReservation(reservationId, { signal }),
        getCouncilDecisions({ reservation_id: reservationId }, { signal }),
      ])
      return { reservation, decision: decisions.data.find((item) => String(item.reservation_id) === String(reservationId)) ?? null }
    },
    [reservationId],
  )
  const detail = useApi(fetchDetail)

  if (detail.error) return <ErrorState error={detail.error} onRetry={detail.reload} />
  if (!detail.data) return <Loader />

  const { reservation, decision } = detail.data
  const editMode = decisionEditMode(reservation, decision, todayInBrussels())
  const passengerCount = reservation.nb_children + reservation.nb_adults

  return (
    <div className="grid gap-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={reservation.status} label={reservation.status_label} />
          <span className="text-sm text-muted">Réservation n° {reservation.id}</span>
        </div>
        <DetailList
          items={[
            ['Organisation', reservation.organization?.name],
            ['Date', <span className="first-letter:uppercase">{formatDate(reservation.trip_date)}</span>],
            ['Horaires', `${formatTime(reservation.departure_time)} → ${formatTime(reservation.return_time)}`],
            ['Trajet', `${shortAddress(reservation.pickup_location)} → ${shortAddress(reservation.destination_location)}`],
            ['Passagers', `${passengerCount} (${reservation.nb_children} enfants, ${reservation.nb_adults} adultes)`],
            ['Motif', reservation.trip_purpose],
            reservation.rejection_reason && ['Motif du refus', reservation.rejection_reason],
            reservation.cancellation_reason && ["Motif de l'annulation", reservation.cancellation_reason],
          ]}
        />
      </section>

      <section className="grid gap-3 border-t border-line pt-5">
        <h3 className="font-bold">Décision du Collège</h3>
        {decision && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={DECISION_STATUS[decision.decision_status]?.tone}>{DECISION_STATUS[decision.decision_status]?.label}</Badge>
            {decision.validated_at && `encodée le ${formatDateTime(decision.validated_at)}`}
          </p>
        )}
        <DecisionSection reservation={reservation} decision={decision} editMode={editMode} onSaved={onSaved} />
      </section>

      {decision && decision.decision_status !== 'en_attente' && can('documents.generate') && (
        <RegenerateDeliberation decisionId={decision.id} onDone={() => setDocumentsVersion((version) => version + 1)} />
      )}

      <TripDocumentsCard key={documentsVersion} reservationId={reservation.id} />
    </div>
  )
}
