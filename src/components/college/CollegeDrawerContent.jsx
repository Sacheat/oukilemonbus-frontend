import { ArrowRight, Check, ListChecks } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { getCouncilDecisions } from '../../api/documents'
import { approveReservation, getReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatTime } from '../../lib/dates'
import { decisionEditMode } from '../../lib/councilDecisions'
import { DECISION_STATUS } from '../../lib/documents'
import { getErrorMessage } from '../../lib/errors'
import { todayInBrussels } from '../../lib/planning'
import { agentActions } from '../../lib/queue'
import { shortAddress } from '../../lib/reservations'
import { TripDocumentsCard } from '../documents/TripDocumentsCard'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { DetailList } from '../ui/DetailList'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { StatusBadge } from '../ui/StatusBadge'
import { DecisionSection } from './DecisionSection'
import { RegenerateDeliberation } from './RegenerateDeliberation'

// Panneau d'une réservation soumise au Collège : résumé, décision (DecisionSection selon decisionEditMode :
// formulaire complet, notes seulement pour un trajet passé, ou lecture seule), délibération et documents.
// Décision favorable et réservation encore à approuver : « Prochaine étape » avec le bouton Approuver (mêmes règles
// que la file, agentActions) ; lien vers la file pour le reste (affectation, conflits).
// `onSaved(décision)` après un enregistrement ; `onApproved(réservation)` après l'approbation.
export function CollegeDrawerContent({ reservationId, onSaved, onApproved }) {
  const { can } = useAuth()
  const [documentsVersion, setDocumentsVersion] = useState(0) // relit les documents après une régénération
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)

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
  const today = todayInBrussels()
  const editMode = decisionEditMode(reservation, decision, today)
  const actions = agentActions(reservation, can, decision, today)

  // Décision enregistrée : le panneau relit la réservation (la suite peut être proposée tout de suite)
  function handleSaved(saved) {
    detail.reload()
    onSaved(saved)
  }

  async function approve() {
    setApproving(true)
    setApproveError(null)
    try {
      const approved = await approveReservation(reservation.id)
      detail.reload()
      onApproved(approved)
    } catch (error) {
      setApproveError(getErrorMessage(error))
    } finally {
      setApproving(false)
    }
  }
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
        <DecisionSection reservation={reservation} decision={decision} editMode={editMode} onSaved={handleSaved} />
      </section>

      {actions.approve && decision?.decision_status === 'approuve' && (
        <section aria-labelledby="college-next-step" className="grid gap-3 rounded-card border border-success/30 bg-success-soft p-4">
          <h3 id="college-next-step" className="flex items-center gap-2 text-sm font-bold">
            <ArrowRight className="size-4 text-success" aria-hidden="true" /> Prochaine étape : approuver la réservation
          </h3>
          <p className="text-sm">
            Le Collège a donné son accord. L’approbation lance l’affectation automatique du chauffeur et du véhicule.
          </p>
          {approveError && <Alert tone="danger">{approveError}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={approve} loading={approving}>
              <Check className="size-4" aria-hidden="true" /> Approuver la réservation
            </Button>
          </div>
        </section>
      )}

      {can('reservations.approve') && (
        <Link
          to={`/gestion/reservations?${new URLSearchParams({ file: 'a-traiter', reservation: String(reservation.id) })}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link hover:underline"
        >
          <ListChecks className="size-4" aria-hidden="true" /> Ouvrir dans la file Réservations
        </Link>
      )}

      {decision && decision.decision_status !== 'en_attente' && can('documents.generate') && (
        <RegenerateDeliberation decisionId={decision.id} onDone={() => setDocumentsVersion((version) => version + 1)} />
      )}

      <TripDocumentsCard key={documentsVersion} reservationId={reservation.id} withDecision={false} />
    </div>
  )
}
