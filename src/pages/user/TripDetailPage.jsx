import { ArrowLeft, Ban, Pencil, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { getReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { TripDocumentsCard } from '../../components/documents/TripDocumentsCard'
import { PassengerListCard } from '../../components/documents/PassengerListCard'
import { CancelReservationModal } from '../../components/reservations/CancelReservationModal'
import { ConfirmPassengersModal } from '../../components/reservations/ConfirmPassengersModal'
import { KeyFacts } from '../../components/reservations/KeyFacts'
import { TripHero } from '../../components/reservations/TripHero'
import { TripMap } from '../../components/reservations/TripMap'
import { TripProgress } from '../../components/reservations/TripProgress'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DetailList } from '../../components/ui/DetailList'
import { ErrorState } from '../../components/ui/ErrorState'
import { Panel } from '../../components/ui/Panel'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../lib/dates'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { canCancel, canConfirmPassengers, canEdit } from '../../lib/reservations'

// Détail d'un déplacement : en-tête façon billet avec les actions, chiffres clés,
// suivi de la demande en étapes, informations, carte du trajet, décision et documents
export function TripDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [dialog, setDialog] = useState(null) // 'cancel' | 'passengers'
  // Message transmis par une autre page (ex. après une modification)
  const location = useLocation()
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const navigate = useNavigate()

  // Le message ne doit s'afficher qu'une fois : on le retire de l'historique (sinon il revient au rechargement)
  useEffect(() => {
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])

  const fetchReservation = useCallback((signal) => getReservation(id, { signal }), [id])
  const { data: reservation, error, loading, reload } = useApi(fetchReservation)

  function handleDone(message) {
    setDialog(null)
    setNotice(message)
    reload()
  }

  const backLink = (
    <Link to="/espace/deplacements" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Mes déplacements
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

  if (!reservation || (loading && reservation.id !== Number(id))) {
    return (
      <div role="status" className="grid gap-5">
        <span className="sr-only">Chargement du déplacement…</span>
        {backLink}
        <Skeleton className="h-52 w-full rounded-panel" />
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    )
  }

  const openConflicts = (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved)
  const isRequester = reservation.requested_by_user_id === user.id
  const organization = reservation.organization
  const stopped = reservation.status === 'annule' || reservation.status === 'refuse'
  const actions = {
    edit: canEdit(user, reservation),
    passengers: canConfirmPassengers(user, reservation),
    cancel: canCancel(user, reservation),
  }
  const hasActions = actions.edit || actions.passengers || actions.cancel

  return (
    <div className="grid gap-5">
      <div>{backLink}</div>

      <TripHero reservation={reservation}>
        {hasActions && (
          <>
            {actions.passengers && (
              <Button variant="accent" onClick={() => setDialog('passengers')}>
                <Users className="size-4" aria-hidden="true" /> Confirmer les passagers
              </Button>
            )}
            {actions.edit && (
              <Button variant="secondary" to={`/espace/deplacements/${reservation.id}/modifier`}>
                <Pencil className="size-4" aria-hidden="true" /> Modifier
              </Button>
            )}
            {actions.cancel && (
              <Button variant="danger" onClick={() => setDialog('cancel')} title="Au moins 24 heures avant le départ">
                <Ban className="size-4" aria-hidden="true" /> Annuler
              </Button>
            )}
          </>
        )}
      </TripHero>

      {notice && <Alert tone="success">{notice}</Alert>}
      {openConflicts.length > 0 && (
        <Alert tone="warning" title="Points à régler">
          <ul className="mt-1 list-disc pl-5">
            {openConflicts.map((conflict) => (
              <li key={conflict.id}>
                <strong>{conflict.type_label}</strong> : {conflict.message}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <KeyFacts reservation={reservation} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Suivi de la demande">
          <div className="p-5">
            <TripProgress reservation={reservation} />
          </div>
        </Panel>

        <Panel title="Informations">
          <div className="px-5 pb-5">
            <DetailList
              items={[
                organization && [
                  'Organisation',
                  `${organization.name} (${organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]})`,
                ],
                ['Demandeur', isRequester ? 'Vous' : 'Un membre de l’organisation'],
                ['Activité', reservation.activity_type_label],
                // « À confirmer » n'a plus de sens une fois le déplacement annulé ou refusé
                reservation.passengers_confirmed_at
                  ? ['Nombre définitif', `Confirmé le ${formatDateTime(reservation.passengers_confirmed_at)}`]
                  : !stopped && ['Nombre définitif', 'À confirmer'],
                ['Validation', reservation.approval_type_label],
                ['Véhicule', reservation.vehicle ? reservation.vehicle.licence_plate : 'Pas encore affecté'],
                ['Chauffeur', reservation.driver ? 'Affecté' : 'Pas encore affecté'],
                reservation.rejection_reason && ['Motif du refus', reservation.rejection_reason],
                reservation.cancellation_reason && ['Motif de l’annulation', reservation.cancellation_reason],
              ]}
            />
            {reservation.recurrence_id && (
              <Link
                to={`/espace/recurrences/${reservation.recurrence_id}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-link hover:underline"
              >
                Fait partie d’une série : voir la série
              </Link>
            )}
          </div>
        </Panel>
      </div>

      {reservation.pickup_location && reservation.destination_location && (
        <Panel title="Carte du trajet">
          <TripMap pickup={reservation.pickup_location} destination={reservation.destination_location} />
        </Panel>
      )}

      {!['refuse', 'annule'].includes(reservation.status) && <PassengerListCard reservationId={reservation.id} audience="user" />}

      <TripDocumentsCard reservationId={reservation.id} />

      <CancelReservationModal
        reservation={reservation}
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onCancelled={() => handleDone('La réservation a été annulée.')}
      />
      <ConfirmPassengersModal
        reservation={reservation}
        open={dialog === 'passengers'}
        onClose={() => setDialog(null)}
        onConfirmed={() => handleDone('Le nombre de passagers a été confirmé.')}
      />
    </div>
  )
}
