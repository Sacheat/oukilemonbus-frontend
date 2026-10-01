import { useCallback } from 'react'
import { getReservation } from '../../api/reservations'
import { useApi } from '../../hooks/useApi'
import { TripReportForm } from '../driver/TripReportForm'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'

// Formulaire du compte rendu pour un agent : le Planning ne donne que le total des passagers, on charge donc la
// réservation (enfants et adultes prévus) pour pré-remplir le formulaire, comme pour le chauffeur.
export function PlanningReportEditor({ reservationId, report, onSaved, onCancel }) {
  const fetchReservation = useCallback((signal) => getReservation(reservationId, { signal }), [reservationId])
  const reservation = useApi(fetchReservation)

  if (reservation.error) return <ErrorState error={reservation.error} onRetry={reservation.reload} />
  if (!reservation.data) return <Loader />
  return <TripReportForm mission={reservation.data} report={report} onSaved={onSaved} onCancel={onCancel} />
}
