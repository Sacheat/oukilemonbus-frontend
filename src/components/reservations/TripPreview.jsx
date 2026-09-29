import { Ban, ExternalLink, Pencil, Repeat, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { getReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatTime } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { canCancel, canConfirmPassengers, canEdit, isTerminal, shortAddress, statusHint, todayApiDate, totalPassengers } from '../../lib/reservations'
import { TripDocumentsCard } from '../documents/TripDocumentsCard'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { DetailList } from '../ui/DetailList'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { StatusBadge } from '../ui/StatusBadge'
import { CancelReservationModal } from './CancelReservationModal'
import { ConfirmPassengersModal } from './ConfirmPassengersModal'

// Contenu de l'aperçu rapide d'un déplacement (panneau latéral de « Mes déplacements ») :
// l'essentiel du détail et les actions, sans quitter la liste. `onChanged` recharge la liste.
export function TripPreview({ reservationId, onChanged }) {
  const { user } = useAuth()
  const [dialog, setDialog] = useState(null) // 'cancel' | 'passengers'
  const [notice, setNotice] = useState(null)
  const fetchReservation = useCallback((signal) => getReservation(reservationId, { signal }), [reservationId])
  const { data: reservation, error, loading, reload } = useApi(fetchReservation)

  function handleDone(message) {
    setDialog(null)
    setNotice(message)
    reload()
    onChanged()
  }

  if (error) return <ErrorState error={error} onRetry={reload} className="m-5" />
  if (!reservation || (loading && reservation.id !== Number(reservationId))) {
    return (
      <div role="status" className="grid gap-4 p-5">
        <span className="sr-only">Chargement du déplacement…</span>
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    )
  }

  const upcoming = !isTerminal(reservation) && reservation.trip_date >= todayApiDate()
  const openConflicts = (reservation.conflicts ?? []).filter((conflict) => !conflict.is_resolved)
  const actions = {
    edit: canEdit(user, reservation),
    passengers: canConfirmPassengers(user, reservation),
    cancel: canCancel(user, reservation),
  }

  return (
    <div className="grid gap-4 p-5">
      <div className="flex overflow-hidden rounded-card border border-line bg-surface shadow-soft">
        <span
          aria-hidden="true"
          className="grid w-20 shrink-0 place-content-center bg-accent text-center leading-none text-on-accent"
        >
          <span className="text-xs font-bold uppercase">{formatDate(reservation.trip_date, { weekday: 'short' }).replace('.', '')}</span>
          <span className="mt-1 text-3xl font-extrabold">{Number(reservation.trip_date.slice(8, 10))}</span>
          <span className="mt-1 text-xs font-bold uppercase">{formatDate(reservation.trip_date, { month: 'short' }).replace('.', '')}</span>
        </span>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={reservation.status} label={reservation.status_label} />
            {upcoming && <span className="text-xs font-semibold text-link">{countdown(reservation.trip_date)}</span>}
          </div>
          <p className="mt-1 text-lg leading-tight font-bold">{reservation.trip_purpose}</p>
          <p className="mt-1 text-sm text-muted">
            {formatDate(reservation.trip_date)} · {formatTime(reservation.departure_time)} → {formatTime(reservation.return_time)}
          </p>
        </div>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      <Alert tone={reservation.status === 'en_conflit' ? 'warning' : 'info'}>{statusHint(reservation)}</Alert>
      {openConflicts.length > 0 && (
        <Alert tone="warning" title="Points à régler">
          <ul className="mt-1 list-disc pl-5">
            {openConflicts.map((conflict) => (
              <li key={conflict.id}>{conflict.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <section aria-label="Trajet et passagers" className="rounded-card border border-line bg-surface px-5 pb-5 shadow-soft">
        <DetailList
          items={[
            ['Prise en charge', shortAddress(reservation.pickup_location)],
            ['Destination', shortAddress(reservation.destination_location)],
            [
              'Passagers',
              `${totalPassengers(reservation)} (${reservation.nb_children} enfant${reservation.nb_children > 1 ? 's' : ''}, ${reservation.nb_adults} adulte${reservation.nb_adults > 1 ? 's' : ''})`,
            ],
            ['Activité', reservation.activity_type_label],
            [
              'Nombre définitif',
              reservation.passengers_confirmed_at ? `Confirmé le ${formatDateTime(reservation.passengers_confirmed_at)}` : 'À confirmer',
            ],
            reservation.organization && ['Organisation', reservation.organization.name],
            reservation.vehicle && ['Véhicule', reservation.vehicle.licence_plate],
          ]}
        />
        {reservation.recurrence_id && (
          <Link
            to={`/espace/recurrences/${reservation.recurrence_id}`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-link hover:underline"
          >
            <Repeat className="size-4" aria-hidden="true" /> Fait partie d’une série : voir la série
          </Link>
        )}
      </section>

      <TripDocumentsCard reservationId={reservation.id} />

      {(actions.edit || actions.passengers || actions.cancel) && (
        <div className="flex flex-wrap gap-2">
          {actions.edit && (
            <Button variant="secondary" to={`/espace/deplacements/${reservation.id}/modifier`}>
              <Pencil className="size-4" aria-hidden="true" /> Modifier
            </Button>
          )}
          {actions.passengers && (
            <Button variant="secondary" onClick={() => setDialog('passengers')}>
              <Users className="size-4" aria-hidden="true" /> Confirmer les passagers
            </Button>
          )}
          {actions.cancel && (
            <Button variant="danger" onClick={() => setDialog('cancel')}>
              <Ban className="size-4" aria-hidden="true" /> Annuler
            </Button>
          )}
        </div>
      )}

      <Link
        to={`/espace/deplacements/${reservation.id}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-link hover:underline"
      >
        <ExternalLink className="size-4" aria-hidden="true" /> Ouvrir la page complète
      </Link>

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
