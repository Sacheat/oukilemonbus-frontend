import { formatDate, formatLocalPeriod, formatTime } from '../../lib/dates'
import { openConflicts } from '../../lib/planning'
import { shortAddress } from '../../lib/reservations'
import { Alert } from '../ui/Alert'
import { DetailList } from '../ui/DetailList'
import { StatusBadge } from '../ui/StatusBadge'

// Détail d'un trajet dans le panneau latéral (lecture seule) : horaires, trajet, affectation, conflits,
// puis chauffeurs et véhicules libres ou non pour ce créneau (include_availability), avec la raison.
export function PlanningTripDetails({ trip }) {
  const conflicts = openConflicts(trip)
  const availability = trip.availability

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={trip.status} label={trip.display?.status_label} />
        {trip.display?.assignment_label && <span className="text-sm text-muted">{trip.display.assignment_label}</span>}
      </div>

      <DetailList
        items={[
          ['Date', <span className="first-letter:uppercase">{formatDate(trip.trip_date)}</span>],
          ['Départ et retour', `${formatTime(trip.departure_time)} → ${formatTime(trip.return_time)}`],
          ['Bus occupé', formatLocalPeriod(trip.occupation_start, trip.occupation_end)],
          ['Organisation', trip.organization?.name],
          ['Départ', trip.pickup_location?.formatted_address ?? shortAddress(trip.pickup_location)],
          ['Destination', trip.destination_location?.formatted_address ?? shortAddress(trip.destination_location)],
          ['Passagers', trip.total_passengers],
          ['Chauffeur', trip.driver?.user?.full_name ?? 'Non affecté'],
          ['Véhicule', trip.vehicle ? `${trip.vehicle.licence_plate} (${trip.vehicle.capacity} places)` : 'Non affecté'],
          ['Réservation', `n° ${trip.reservation_id}`],
        ]}
      />

      {conflicts.length > 0 && (
        <section className="grid gap-2">
          <h3 className="font-bold">Conflits ouverts</h3>
          {conflicts.map((conflict) => (
            <Alert key={conflict.id} tone="warning" title={conflict.type_label}>
              {conflict.message}
            </Alert>
          ))}
        </section>
      )}

      {availability && (
        <section className="grid gap-4 border-t border-line pt-5">
          <h3 className="font-bold">Disponibilités sur ce créneau</h3>
          <AvailabilityGroup
            title="Chauffeurs"
            available={availability.drivers?.available ?? []}
            unavailable={availability.drivers?.unavailable ?? []}
            nameOf={(driver) => driver.name}
          />
          <AvailabilityGroup
            title="Véhicules"
            available={availability.vehicles?.available ?? []}
            unavailable={availability.vehicles?.unavailable ?? []}
            nameOf={(vehicle) => `${vehicle.licence_plate} (${vehicle.capacity} places)`}
          />
        </section>
      )}
    </div>
  )
}

// Libres d'un côté, occupés de l'autre avec la raison donnée par le backend
function AvailabilityGroup({ title, available, unavailable, nameOf }) {
  return (
    <div className="text-sm">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1">
        <span className="text-muted">Libres : </span>
        {available.length > 0 ? available.map(nameOf).join(', ') : 'aucun'}
      </p>
      {unavailable.length > 0 && (
        <ul className="mt-1 grid gap-0.5 text-muted">
          {unavailable.map((item) => (
            <li key={item.id}>
              {nameOf(item)} : {item.unavailable_reason ?? 'indisponible'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
