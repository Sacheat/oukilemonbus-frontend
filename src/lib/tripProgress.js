import { formatDate, formatDateTime } from './dates'
import { countdown } from './home'
import { todayApiDate } from './reservations'

// Étapes du suivi d'une demande, comme le suivi d'un colis.
// État d'une étape : 'done' (franchie), 'current' (en cours), 'warning' (bloquée), 'stopped' (refus
// ou annulation : le parcours s'arrête là), 'upcoming' (à venir).
export function progressSteps(reservation, today = todayApiDate()) {
  const { status } = reservation
  const manual = reservation.approval_type === 'manuel'
  const past = reservation.trip_date < today

  const sent = { key: 'sent', label: 'Demande envoyée', detail: formatDateTime(reservation.created_at), state: 'done' }

  const validated = reservation.validated_at
    ? {
        key: 'validated',
        label: manual ? 'Validée par la commune' : 'Approuvée automatiquement',
        detail: formatDateTime(reservation.validated_at),
        state: 'done',
      }
    : status === 'refuse'
      ? { key: 'validated', label: 'Demande refusée', detail: reservation.rejection_reason, state: 'stopped' }
      : status === 'en_conflit'
        ? { key: 'validated', label: 'Validation bloquée', detail: 'Un problème est à régler par la commune.', state: 'warning' }
        : {
            key: 'validated',
            label: 'Validation',
            detail: manual ? 'Examen par la commune, puis décision du Collège.' : 'Approbation automatique.',
            state: status === 'en_attente' ? 'current' : 'upcoming',
          }

  const assigned =
    status === 'confirme'
      ? { key: 'assigned', label: 'Chauffeur et véhicule affectés', detail: reservation.vehicle?.licence_plate ?? null, state: 'done' }
      : status === 'en_conflit' && reservation.validated_at
        ? { key: 'assigned', label: 'Affectation bloquée', detail: 'Un problème est à régler par la commune.', state: 'warning' }
        : {
            key: 'assigned',
            label: 'Chauffeur et véhicule',
            detail: status === 'approuve' ? 'Affectation en cours.' : null,
            state: status === 'approuve' ? 'current' : 'upcoming',
          }

  const trip =
    status === 'confirme' && past
      ? { key: 'trip', label: 'Trajet effectué', detail: formatDate(reservation.trip_date), state: 'done' }
      : {
          key: 'trip',
          label: 'Jour du trajet',
          detail: past ? formatDate(reservation.trip_date) : `${formatDate(reservation.trip_date)} (${countdown(reservation.trip_date)})`,
          state: status === 'confirme' ? 'current' : 'upcoming',
        }

  const steps = [sent, validated, assigned, trip]

  // Refus : le parcours s'arrête à l'étape de validation
  if (status === 'refuse') return steps.slice(0, 2)

  // Annulation : on garde les étapes franchies, puis l'arrêt
  if (status === 'annule') {
    return [
      ...steps.filter((step) => step.state === 'done'),
      {
        key: 'cancelled',
        label: 'Réservation annulée',
        detail: [reservation.cancelled_at && formatDateTime(reservation.cancelled_at), reservation.cancellation_reason]
          .filter(Boolean)
          .join(' · '),
        state: 'stopped',
      },
    ]
  }
  return steps
}
