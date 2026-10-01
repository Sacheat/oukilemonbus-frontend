import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { getReservation } from '../../api/reservations'
import { ReservationWizard } from '../../components/reservations/wizard/ReservationWizard'
import { Alert } from '../../components/ui/Alert'
import { ErrorState } from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { todayInBrussels } from '../../lib/planning'
import { reservationToValues } from '../../lib/reservationForm'

// Modification d'une réservation par un agent, pour régler un conflit (horaires, lieux, passagers).
// Même assistant que l'usager, textes adaptés ; organisation en lecture seule. Retour à la file avec ses filtres
// (?retour=…) et un message. Réservation refusée, annulée ou trajet passé : plus de modification.
export function ReservationEditPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Retour vers la file, filtres compris ; seule une adresse de la file est acceptée
  const back = searchParams.get('retour')
  const queuePath = `/gestion/reservations${back?.startsWith('?') ? back : `?reservation=${id}`}`

  const fetchReservation = useCallback((signal) => getReservation(id, { signal }), [id])
  const { data: reservation, error, reload } = useApi(fetchReservation)

  const backLink = (
    <Link to={queuePath} className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Retour à la file
    </Link>
  )

  if (error) {
    const status = error.response?.status
    return (
      <>
        {backLink}
        {status === 404 || status === 403 ? (
          <Alert tone="danger" title="Réservation introuvable" className="mt-4">
            Cette réservation n’existe pas ou vous n’y avez pas accès.
          </Alert>
        ) : (
          <ErrorState error={error} onRetry={reload} className="mt-4" />
        )}
      </>
    )
  }

  if (!reservation || reservation.id !== Number(id)) {
    return (
      <div role="status" className="grid gap-5">
        <span className="sr-only">Chargement de la réservation…</span>
        {backLink}
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    )
  }

  const terminal = ['refuse', 'annule'].includes(reservation.status)
  if (terminal || reservation.trip_date.slice(0, 10) < todayInBrussels()) {
    return (
      <div className="grid gap-5">
        <div>{backLink}</div>
        <Alert tone="warning" title="Cette réservation ne peut plus être modifiée">
          {terminal ? `Elle est ${reservation.status === 'refuse' ? 'refusée' : 'annulée'}.` : 'Le trajet est passé.'}
        </Alert>
      </div>
    )
  }

  return (
    <>
      {backLink}
      <ReservationWizard
        mode="edit"
        agent
        initial={{ values: reservationToValues(reservation) }}
        organizations={reservation.organization ? [reservation.organization] : []}
        reservation={reservation}
        onDone={() => navigate(queuePath, { state: { notice: `Modifications enregistrées pour « ${reservation.trip_purpose} ».` } })}
        onCancel={() => navigate(queuePath)}
      />
    </>
  )
}
