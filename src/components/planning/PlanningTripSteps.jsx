import { TriangleAlert } from 'lucide-react'
import { useCallback } from 'react'
import { getTripProgress } from '../../api/tripProgress'
import { useApi } from '../../hooks/useApi'
import { JOURNEY_STEPS, positionStateText, stepChecksByType, stepDistanceText } from '../../lib/driverJourney'
import { PlanningStepsMap } from './PlanningStepsMap'

const SOURCE_LABELS = { chauffeur: 'chauffeur', agent: 'agent', gps: 'GPS', systeme: 'système' }

// Étapes enregistrées d'un trajet (boutons Départ / Arrivée du chauffeur), dans le panneau du Planning : heure réelle,
// qui l'a signalée, si la position a été envoyée, et à quelle distance du lieu prévu (meta.step_checks, relu ici
// quand une étape s'ajoute). Au-delà du seuil de la commune, l'étape est signalée « loin du lieu prévu » ; rien n'est
// bloqué. Petite carte des positions sous la liste. Rien tant qu'aucune étape n'est enregistrée.
export function PlanningTripSteps({ trip, progress }) {
  const events = progress?.events ?? []
  const reservationId = trip.reservation_id
  const eventCount = events.length
  const fetchChecks = useCallback(
    (signal) => (eventCount > 0 ? getTripProgress(reservationId, { signal }) : Promise.resolve(null)),
    [reservationId, eventCount],
  )
  const detail = useApi(fetchChecks)
  if (eventCount === 0) return null

  const checks = stepChecksByType(detail.data?.meta?.step_checks)
  const threshold = detail.data?.meta?.step_distance_warning_meters
  const detailEvents = detail.data?.data?.events ?? []
  const mapSteps = JOURNEY_STEPS.map((step, index) => {
    const event = detailEvents.find((item) => item.type === step.type)
    return event && { number: index + 1, latitude: event.latitude, longitude: event.longitude, far: Boolean(checks[step.type]?.far_from_expected), label: `${step.leg} · ${step.label}` }
  }).filter(Boolean)
  const farCount = Object.values(checks).filter((check) => check.far_from_expected).length

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Étapes du trajet</h3>
      {farCount > 0 && (
        <p className="flex items-start gap-2 rounded-control bg-danger-soft p-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {farCount === 1 ? 'Une étape a été enregistrée' : `${farCount} étapes ont été enregistrées`} à plus de {threshold} m du lieu
          prévu. À vérifier avec le chauffeur (bouton appuyé trop tôt ou trop tard, GPS imprécis).
        </p>
      )}
      <ol className="grid gap-1.5 text-sm">
        {JOURNEY_STEPS.map((step, index) => {
          const event = events.find((item) => item.type === step.type)
          const check = checks[step.type]
          const distance = stepDistanceText(check)
          return (
            <li key={step.type} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-44 text-muted">
                {index + 1}. {step.leg} · {step.label}
              </span>
              {event ? (
                <span className="min-w-0 flex-1">
                  <strong className="tabular-nums">{event.local_time}</strong>{' '}
                  <span className="text-muted">
                    ({SOURCE_LABELS[event.source] ?? event.source}, {positionStateText(event.position_state)})
                  </span>
                  {distance && (
                    <span className={check.far_from_expected ? 'block font-semibold text-danger' : 'block text-muted'}>
                      {check.far_from_expected ? 'Loin du lieu prévu : ' : ''}
                      {distance}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </li>
          )
        })}
      </ol>
      <PlanningStepsMap pickup={trip.pickup_location} destination={trip.destination_location} steps={mapSteps} />
    </section>
  )
}
