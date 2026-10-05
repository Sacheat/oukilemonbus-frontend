import { JOURNEY_STEPS, positionStateText } from '../../lib/driverJourney'

const SOURCE_LABELS = { chauffeur: 'chauffeur', agent: 'agent', gps: 'GPS', systeme: 'système' }

// Étapes enregistrées d'un trajet (boutons Départ / Arrivée du chauffeur), dans le panneau du Planning : heure réelle,
// qui l'a signalée, et si la position a été envoyée. Rien tant qu'aucune étape n'est enregistrée.
export function PlanningTripSteps({ progress }) {
  const events = progress?.events ?? []
  if (events.length === 0) return null

  return (
    <section className="grid gap-2 border-t border-line pt-5">
      <h3 className="font-bold">Étapes du trajet</h3>
      <ol className="grid gap-1.5 text-sm">
        {JOURNEY_STEPS.map((step) => {
          const event = events.find((item) => item.type === step.type)
          return (
            <li key={step.type} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-40 text-muted">
                {step.leg} · {step.label}
              </span>
              {event ? (
                <span>
                  <strong className="tabular-nums">{event.local_time}</strong>{' '}
                  <span className="text-muted">
                    ({SOURCE_LABELS[event.source] ?? event.source}, {positionStateText(event.position_state)})
                  </span>
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
