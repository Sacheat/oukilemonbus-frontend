import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { useParams } from 'react-router'
import { getReservation } from '../../api/reservations'
import { RouteButtons } from '../../components/driver/RouteButtons'
import { TripReportSection } from '../../components/driver/TripReportSection'
import { TripMap } from '../../components/reservations/TripMap'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DetailList } from '../../components/ui/DetailList'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatDateTime, formatTime } from '../../lib/dates'
import { isCancelledMission } from '../../lib/driverMissions'
import { estimatedArrivals, totalPassengers } from '../../lib/reservations'

// Détail d'une mission du chauffeur (/chauffeur/missions/:id), page à part pour le téléphone :
// horaires et adresses complètes, itinéraires, carte, passagers, véhicule, et compte rendu du trajet
// (seule saisie du chauffeur, cahier des charges §3).
// Le backend n'autorise que le chauffeur affecté (403 sinon).
export function DriverMissionPage() {
  const { missionId } = useParams()
  const fetchMission = useCallback((signal) => getReservation(missionId, { signal }), [missionId])
  const mission = useApi(fetchMission)

  const backLink = (
    <Button variant="link" to="/chauffeur" className="w-fit">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Mes missions
    </Button>
  )

  if (mission.error) {
    return (
      <div className="grid gap-4">
        {backLink}
        <ErrorState error={mission.error} onRetry={mission.reload} />
      </div>
    )
  }
  if (!mission.data) return <Loader />

  const trip = mission.data
  const arrivals = estimatedArrivals(trip)
  const cancelled = isCancelledMission(trip)

  return (
    <div className="grid gap-6">
      {backLink}
      <PageHeader
        eyebrow={<span className="first-letter:uppercase">{formatDate(trip.trip_date)}</span>}
        title={trip.organization?.name ?? `Mission n° ${trip.id}`}
        actions={<StatusBadge status={trip.status} label={trip.status_label} />}
      />

      {cancelled && (
        <Alert tone="warning" title="Cette mission n'a plus lieu">
          {trip.cancellation_reason ?? trip.rejection_reason ?? 'Elle a été annulée.'}
        </Alert>
      )}

      <TripReportSection mission={trip} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <section aria-labelledby="mission-horaires" className="grid gap-2">
            <h2 id="mission-horaires" className="text-lg font-bold">Horaires et trajet</h2>
            <DetailList
              items={[
                ['Départ', `${formatTime(trip.departure_time)} · ${trip.pickup_location?.formatted_address ?? ''}`],
                ['Destination', trip.destination_location?.formatted_address],
                arrivals?.outbound && ['Arrivée estimée', `vers ${arrivals.outbound}`],
                ['Retour', `${formatTime(trip.return_time)} (départ de la destination)`],
                arrivals?.back && ['Retour estimé au départ', `vers ${arrivals.back}`],
                trip.distance_km && ['Distance', `${Number(trip.distance_km).toLocaleString('fr-BE')} km`],
              ]}
            />
          </section>

          {!cancelled && <RouteButtons pickup={trip.pickup_location} destination={trip.destination_location} />}

          <section aria-labelledby="mission-groupe" className="grid gap-2">
            <h2 id="mission-groupe" className="text-lg font-bold">Groupe et véhicule</h2>
            <DetailList
              items={[
                ['Passagers', `${totalPassengers(trip)} (${trip.nb_children} enfants, ${trip.nb_adults} adultes)`],
                trip.passengers_confirmed_at && ['Nombre définitif', `confirmé le ${formatDateTime(trip.passengers_confirmed_at)}`],
                ['Activité', trip.activity_type_label],
                ['Motif', trip.trip_purpose],
                ['Véhicule', trip.vehicle ? `${trip.vehicle.licence_plate} (${trip.vehicle.capacity} places)` : 'Non affecté'],
              ]}
            />
          </section>
        </div>

        <TripMap pickup={trip.pickup_location} destination={trip.destination_location} height="h-72 lg:h-96" />
      </div>
    </div>
  )
}
