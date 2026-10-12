import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback } from 'react'
import { useParams } from 'react-router'
import { getTripRoute } from '../../api/driverJourney'
import { getReservation } from '../../api/reservations'
import { RouteButtons } from '../../components/driver/RouteButtons'
import { RouteSteps } from '../../components/driver/RouteSteps'
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
import { useNavigationEngine } from '../../hooks/useNavigationEngine'
import { formatDate, formatDateTime, formatTime } from '../../lib/dates'
import { isCancelledMission, roundTripKmText, showsMissionStatus } from '../../lib/driverMissions'
import { todayInBrussels } from '../../lib/planning'
import { estimatedArrivals, totalPassengers } from '../../lib/reservations'
import { hasTripStarted } from '../../lib/tripReports'

// Détail d'une mission du chauffeur (/chauffeur/missions/:id), page à part pour le téléphone :
// horaires et adresses complètes, itinéraires (application de la commune), carte avec la route réelle et ses
// instructions, passagers, véhicule, et compte rendu du trajet (cahier des charges §3) : en tête une fois l'heure de
// départ passée (il est attendu), en bas avant (« vous pourrez confirmer à partir de… »). Mission du jour : bouton
// « Ma journée ». Statut seulement s'il n'est pas « Confirmé ».
// La route est calculée par le backend à la première ouverture puis gardée ; en cas d'échec, la carte garde la ligne
// à vol d'oiseau (aucun message : la mission reste lisible).
// Le backend n'autorise que le chauffeur affecté (403 sinon).
export function DriverMissionPage() {
  const { missionId } = useParams()
  const fetchMission = useCallback((signal) => getReservation(missionId, { signal }), [missionId])
  const mission = useApi(fetchMission)
  const fetchRoute = useCallback((signal) => getTripRoute(missionId, { signal }), [missionId])
  const route = useApi(fetchRoute)
  const engine = useNavigationEngine()

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
  const started = hasTripStarted(trip)
  const isToday = trip.trip_date.slice(0, 10) === todayInBrussels()

  return (
    <div className="grid gap-6">
      {backLink}
      <PageHeader
        eyebrow={<span className="first-letter:uppercase">{formatDate(trip.trip_date)}</span>}
        title={trip.organization?.name ?? `Mission n° ${trip.id}`}
        actions={
          <>
            {showsMissionStatus(trip) && <StatusBadge status={trip.status} label={trip.status_label} />}
            {isToday && !cancelled && (
              <Button variant="accent" to="/chauffeur/journee">
                Ma journée <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </>
        }
      />

      {cancelled && (
        <Alert tone="warning" title="Cette mission n'a plus lieu">
          {trip.cancellation_reason ?? trip.rejection_reason ?? 'Elle a été annulée.'}
        </Alert>
      )}

      {started && <TripReportSection mission={trip} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <section aria-labelledby="mission-horaires" className="grid gap-2">
            <h2 id="mission-horaires" className="text-lg font-bold">Horaires et trajet</h2>
            <DetailList
              sideBySideFrom="sm"
              items={[
                ['Départ', `${formatTime(trip.departure_time)} · ${trip.pickup_location?.formatted_address ?? ''}`],
                ['Destination', trip.destination_location?.formatted_address],
                arrivals?.outbound && ['Arrivée estimée', `vers ${arrivals.outbound}`],
                ['Retour', `${formatTime(trip.return_time)} (départ de la destination)`],
                arrivals?.back && ['Retour estimé au départ', `vers ${arrivals.back}`],
                trip.distance_km && ['Distance aller-retour', roundTripKmText(trip)],
              ]}
            />
          </section>

          {!cancelled && (
            <RouteButtons engine={engine} pickup={trip.pickup_location} destination={trip.destination_location} />
          )}

          <section aria-labelledby="mission-groupe" className="grid gap-2">
            <h2 id="mission-groupe" className="text-lg font-bold">Groupe et véhicule</h2>
            <DetailList
              sideBySideFrom="sm"
              items={[
                ['Passagers', `${totalPassengers(trip)} (${trip.nb_children} enfant${trip.nb_children > 1 ? 's' : ''}, ${trip.nb_adults} adulte${trip.nb_adults > 1 ? 's' : ''})`],
                trip.passengers_confirmed_at && ['Nombre définitif', `confirmé le ${formatDateTime(trip.passengers_confirmed_at)}`],
                ['Activité', trip.activity_type_label],
                ['Motif', trip.trip_purpose],
                ['Véhicule', trip.vehicle ? `${trip.vehicle.licence_plate} (${trip.vehicle.capacity} places)` : 'Non affecté'],
              ]}
            />
          </section>
        </div>

        <div className="grid gap-3">
          <TripMap
            pickup={trip.pickup_location}
            destination={trip.destination_location}
            route={route.data}
            height="h-72 lg:h-96"
          />
          {!cancelled && <RouteSteps route={route.data} />}
        </div>
      </div>

      {!started && <TripReportSection mission={trip} />}
    </div>
  )
}
