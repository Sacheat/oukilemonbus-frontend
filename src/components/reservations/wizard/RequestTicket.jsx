import { Building2, MapPin, Users } from 'lucide-react'
import { formatDate } from '../../../lib/dates'
import { estimatedArrivals, shortAddress } from '../../../lib/reservations'
import { TripLeg } from '../TripLeg'

// Ville d'un lieu choisi (l'adresse complète ne tient pas dans le récapitulatif), sinon « … »
function place(location) {
  return location ? location.city || shortAddress(location) : '…'
}

// Contenu du mini-billet de la demande en cours : talon daté, organisation, trajets aller et retour
// (heures d'arrivée estimées dès que le trajet a été vérifié : `estimate` = réponse de check-trip ou du
// preview pour la saisie actuelle), passagers. Chaque élément n'apparaît qu'une fois renseigné.
export function RequestTicket({ values, organization, estimate }) {
  const arrivals = estimatedArrivals(estimate)
  const passengers = values.nb_adults ? Number(values.nb_children || 0) + Number(values.nb_adults) : null
  const hasTrip = values.pickup || values.destination || values.departure_time || values.return_time
  const empty = !organization && !values.trip_date && !hasTrip

  return (
    <div className="grid gap-4 text-sm">
      {values.trip_date && (
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid w-12 shrink-0 place-content-center rounded-lg bg-accent py-1.5 text-center leading-none text-on-accent">
            <span className="text-[10px] font-bold uppercase">
              {formatDate(values.trip_date, { weekday: 'short' }).replace('.', '')}
            </span>
            <span className="text-xl font-extrabold">{Number(values.trip_date.slice(8, 10))}</span>
          </span>
          <p className="font-bold">{formatDate(values.trip_date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      )}

      {organization && (
        <p className="flex items-center gap-2">
          <Building2 className="size-4 shrink-0 text-muted" aria-hidden="true" /> {organization.name}
        </p>
      )}

      {hasTrip && (
        <div className="grid gap-3 border-t border-dashed border-line pt-3">
          {/* Un trajet n'apparaît qu'avec son heure ; sans heure, les lieux seuls */}
          {values.departure_time && (
            <TripLeg
              variant="card"
              label="Aller"
              departure={values.departure_time}
              arrival={arrivals?.outbound}
              from={place(values.pickup)}
              to={place(values.destination)}
            />
          )}
          {values.return_time && (
            <TripLeg
              variant="card"
              label="Retour"
              departure={values.return_time}
              arrival={arrivals?.back}
              from={place(values.destination)}
              to={place(values.pickup)}
            />
          )}
          {!values.departure_time && !values.return_time && (
            <p className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-muted" aria-hidden="true" /> {place(values.pickup)} → {place(values.destination)}
            </p>
          )}
        </div>
      )}

      {passengers && (
        <p className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-muted" aria-hidden="true" /> {passengers} passager{passengers > 1 ? 's' : ''}
        </p>
      )}

      {empty && <p className="text-muted">Rien de renseigné pour l’instant.</p>}
    </div>
  )
}
