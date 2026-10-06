import { ArrowRight, Bus, Navigation, Phone, Users } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../../lib/cx'
import { formatTime } from '../../../lib/dates'
import { PROGRESS_BADGES } from '../../../lib/driverJourney'
import { ROUTE_TAB_NAME } from '../../../lib/driverMissions'
import { navigationLink } from '../../../lib/navigation'
import { estimatedArrivals, shortAddress, totalPassengers } from '../../../lib/reservations'
import { Badge } from '../../ui/Badge'
import { StatusBadge } from '../../ui/StatusBadge'
import { HelpButton } from './HelpButton'
import { JourneyStepButtons } from './JourneyStepButtons'

// Où mène « Itinéraire » selon l'avancement : vers le lieu de départ (avant le départ), vers la destination (aller),
// puis de nouveau vers le lieu de départ (retour). Depuis la position du téléphone, avec l'application de la commune. Rien une fois le trajet terminé.
function routeTarget(mission, state) {
  if (state === 'termine') return null
  if (state === 'en_route_aller') return { location: mission.destination_location, label: 'Itinéraire vers la destination' }
  if (state === 'sur_place' || state === 'en_route_retour') return { location: mission.pickup_location, label: 'Itinéraire du retour' }
  return { location: mission.pickup_location, label: 'Itinéraire vers le départ' }
}

// Un trajet de « Ma journée » : horaires, organisation (appel direct), trajet, passagers, bus, itinéraire,
// les quatre étapes et « Aide ». `engine` : application de navigation de la commune. `current` : trajet en cours, mis en avant. Une mission seulement approuvée
// (pas encore confirmée par un agent) garde ses boutons éteints.
export function JourneyTripCard({ mission, progress, current, engine, onRecorded, onUndone, onAlertSent }) {
  const state = progress?.state ?? 'a_venir'
  const arrivals = estimatedArrivals(mission)
  const passengerCount = totalPassengers(mission)
  const target = routeTarget(mission, state)
  const route = target ? navigationLink(engine, target.location) : null
  const confirmed = mission.status === 'confirme'
  const progressBadge = PROGRESS_BADGES[state]
  const phone = mission.organization?.phone_contact

  return (
    <article
      aria-label={`Trajet de ${formatTime(mission.departure_time)}, ${mission.organization?.name ?? ''}`}
      className={cx(
        'grid gap-4 rounded-panel border bg-surface p-4 sm:p-5',
        current ? 'border-primary shadow-soft ring-2 ring-primary/30' : 'border-line',
        state === 'termine' && 'opacity-80',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-extrabold tabular-nums">
            {formatTime(mission.departure_time)} → {formatTime(mission.return_time)}
          </p>
          <p className="font-semibold break-words">{mission.organization?.name}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {progressBadge && <Badge tone={progressBadge.tone}>{progressBadge.label}</Badge>}
          <StatusBadge status={mission.status} label={mission.status_label} />
        </div>
      </header>

      <div className="grid gap-1 text-sm">
        <p className="break-words">
          <span className="text-muted">Départ :</span> {shortAddress(mission.pickup_location)}
        </p>
        <p className="break-words">
          <span className="text-muted">Destination :</span> {shortAddress(mission.destination_location)}
          {arrivals?.outbound && <span className="text-muted"> · arrivée vers {arrivals.outbound}</span>}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            {passengerCount} passager{passengerCount > 1 ? 's' : ''}
          </span>
          {mission.vehicle && (
            <span className="inline-flex items-center gap-1.5">
              <Bus className="size-4" aria-hidden="true" />
              {mission.vehicle.licence_plate}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {route && (
          <a
            href={route.href}
            target={route.external ? undefined : ROUTE_TAB_NAME}
            className="inline-flex min-h-12 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 font-bold hover:bg-surface-muted"
          >
            <Navigation className="size-5" aria-hidden="true" />
            {target.label}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 font-bold hover:bg-surface-muted"
          >
            <Phone className="size-5" aria-hidden="true" />
            Appeler l’organisation
          </a>
        )}
      </div>

      {confirmed ? (
        <JourneyStepButtons mission={mission} progress={progress} onRecorded={onRecorded} onUndone={onUndone} />
      ) : (
        <p className="rounded-control bg-surface-muted p-3 text-sm text-muted">
          Mission pas encore confirmée par un agent : les boutons s’activeront après la confirmation.
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <HelpButton mission={mission} onSent={onAlertSent} />
        <Link to={`/chauffeur/missions/${mission.id}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-link">
          Détail de la mission
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  )
}
