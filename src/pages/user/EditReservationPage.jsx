import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { TripHero } from '../../components/reservations/TripHero'
import { ReservationWizard } from '../../components/reservations/wizard/ReservationWizard'
import { Alert } from '../../components/ui/Alert'
import { ErrorState } from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { reservationToValues } from '../../lib/reservationForm'
import { canEdit, statusHint } from '../../lib/reservations'

// Modification d'une réservation (demandeur ou responsable, statut en attente ou en conflit)
export function EditReservationPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const detailPath = `/espace/deplacements/${id}`

  const fetchReservation = useCallback((signal) => getReservation(id, { signal }), [id])
  const { data: reservation, error, reload } = useApi(fetchReservation)

  const backLink = (
    <Link to={detailPath} className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Retour au déplacement
    </Link>
  )

  if (error) {
    const status = error.response?.status
    return (
      <>
        {backLink}
        {status === 404 || status === 403 ? (
          <Alert tone="danger" title="Déplacement introuvable" className="mt-4">
            Ce déplacement n’existe pas ou vous n’y avez pas accès.
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="hidden h-72 rounded-card lg:block" />
        </div>
      </div>
    )
  }

  if (!canEdit(user, reservation)) {
    return (
      <div className="grid gap-5">
        <div>{backLink}</div>
        <TripHero reservation={reservation} />
        <Alert tone="warning" title="Cette réservation ne peut plus être modifiée">
          <p>{statusHint(reservation)}</p>
          <p className="mt-1">
            Seules les demandes en attente ou en conflit peuvent être modifiées, par le demandeur ou un responsable de
            l’organisation.
          </p>
        </Alert>
      </div>
    )
  }

  return (
    <>
      {backLink}
      <ReservationWizard
        mode="edit"
        initial={{ values: reservationToValues(reservation) }}
        organizations={reservation.organization ? [reservation.organization] : []}
        reservation={reservation}
        onDone={() => navigate(detailPath, { state: { notice: 'Vos modifications ont été enregistrées.' } })}
        onCancel={() => navigate(detailPath)}
      />
    </>
  )
}
