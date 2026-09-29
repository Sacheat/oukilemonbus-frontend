import { ArrowLeft, Ban, Pencil, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { getReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { CancelReservationModal } from '../../components/reservations/CancelReservationModal'
import { ConfirmPassengersModal } from '../../components/reservations/ConfirmPassengersModal'
import { DateBadge } from '../../components/reservations/DateBadge'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DetailList } from '../../components/ui/DetailList'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatLocalRange, formatTime } from '../../lib/dates'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { canCancel, canConfirmPassengers, canEdit, shortAddress, statusHint, totalPassengers } from '../../lib/reservations'

const STATUS_TONES = {
  en_attente: 'warning',
  approuve: 'info',
  confirme: 'success',
  en_conflit: 'warning',
  refuse: 'danger',
  annule: 'info',
}

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

  if (!reservation || (loading && reservation.id !== Number(id))) return <Loader />

  const openConflicts = (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved)
  const isRequester = reservation.requested_by_user_id === user.id
  const organization = reservation.organization

  return (
    <>
      {backLink}

      <header className="mt-2 flex flex-wrap items-start gap-4.5 pb-6">
        <DateBadge date={reservation.trip_date} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">Déplacement</p>
          <h1 className="mt-1 text-[27px] leading-tight font-bold tracking-tight">{reservation.trip_purpose}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <StatusBadge status={reservation.status} label={reservation.status_label} />
            <span>
              {formatDate(reservation.trip_date)} · {formatTime(reservation.departure_time)} →{' '}
              {formatTime(reservation.return_time)}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {notice && <Alert tone="success">{notice}</Alert>}
        <Alert tone={STATUS_TONES[reservation.status]}>{statusHint(reservation)}</Alert>

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

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card as="section" aria-labelledby="trip-title">
            <h2 id="trip-title" className="text-[17px] font-bold">
              Trajet
            </h2>
            <DetailList
              items={[
                ['Prise en charge', shortAddress(reservation.pickup_location)],
                ['Destination', shortAddress(reservation.destination_location)],
                ['Date', formatDate(reservation.trip_date)],
                ['Départ', formatTime(reservation.departure_time)],
                ['Départ du retour', formatTime(reservation.return_time)],
                reservation.distance_km && ['Distance', `${Number(reservation.distance_km).toLocaleString('fr-BE')} km`],
                reservation.estimated_duration_min && ['Durée estimée du trajet', `${reservation.estimated_duration_min} min`],
                reservation.estimated_occupation && [
                  'Bus réservé',
                  formatLocalRange(reservation.estimated_occupation.start_at, reservation.estimated_occupation.end_at),
                ],
              ]}
            />
          </Card>

          <Card as="section" aria-labelledby="passengers-title">
            <h2 id="passengers-title" className="text-[17px] font-bold">
              Passagers
            </h2>
            <DetailList
              items={[
                ['Enfants', reservation.nb_children],
                ['Adultes', reservation.nb_adults],
                ['Total', totalPassengers(reservation)],
                ['Activité', reservation.activity_type_label],
                [
                  'Nombre définitif',
                  reservation.passengers_confirmed_at
                    ? `Confirmé le ${formatDateTime(reservation.passengers_confirmed_at)}`
                    : 'À confirmer',
                ],
              ]}
            />
          </Card>

          <Card as="section" aria-labelledby="follow-title">
            <h2 id="follow-title" className="text-[17px] font-bold">
              Suivi
            </h2>
            <DetailList
              items={[
                organization && [
                  'Organisation',
                  `${organization.name} (${organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]})`,
                ],
                ['Demandeur', isRequester ? 'Vous' : 'Un membre de l’organisation'],
                ['Validation', reservation.approval_type_label],
                ['Demande envoyée le', formatDateTime(reservation.created_at)],
                reservation.validated_at && ['Validée le', formatDateTime(reservation.validated_at)],
                reservation.cancelled_at && ['Annulée le', formatDateTime(reservation.cancelled_at)],
                reservation.rejection_reason && ['Motif du refus', reservation.rejection_reason],
                reservation.cancellation_reason && ['Motif de l’annulation', reservation.cancellation_reason],
              ]}
            />
          </Card>

          <Card as="section" aria-labelledby="assignment-title">
            <h2 id="assignment-title" className="text-[17px] font-bold">
              Affectation
            </h2>
            <DetailList
              items={[
                ['Véhicule', reservation.vehicle ? reservation.vehicle.licence_plate : 'Pas encore affecté'],
                ['Chauffeur', reservation.driver ? 'Affecté' : 'Pas encore affecté'],
              ]}
            />
          </Card>
        </div>

        {(canEdit(user, reservation) || canConfirmPassengers(user, reservation) || canCancel(user, reservation)) && (
          <Card as="section" aria-labelledby="actions-title" className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="actions-title" className="text-[17px] font-bold">
                Actions
              </h2>
              <p className="mt-1 text-sm text-muted">L’annulation doit intervenir au moins 24 heures avant le départ.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit(user, reservation) && (
                <Button variant="secondary" to={`/espace/deplacements/${reservation.id}/modifier`}>
                  <Pencil className="size-4" aria-hidden="true" /> Modifier
                </Button>
              )}
              {canConfirmPassengers(user, reservation) && (
                <Button variant="secondary" onClick={() => setDialog('passengers')}>
                  <Users className="size-4" aria-hidden="true" /> Confirmer les passagers
                </Button>
              )}
              {canCancel(user, reservation) && (
                <Button variant="danger" onClick={() => setDialog('cancel')}>
                  <Ban className="size-4" aria-hidden="true" /> Annuler
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

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
    </>
  )
}
