import { ChevronDown } from 'lucide-react'
import { routeDistanceText, routeDurationText } from '../../lib/navigation'

// Instructions de l'itinéraire (aller, calculé par le backend) : repliées par défaut, pour préparer le trajet.
// La navigation pendant la conduite passe par l'application du téléphone (boutons d'itinéraire).
export function RouteSteps({ route }) {
  const steps = route?.steps?.filter((step) => step.instruction) ?? []
  if (steps.length === 0) return null

  return (
    <details className="group rounded-panel border border-line bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold">
        <span>
          Itinéraire de l’aller
          <span className="font-normal text-muted">
            {' '}· {routeDistanceText(route.distance_m)}, environ {routeDurationText(route.duration_s)}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <ol className="grid gap-2 border-t border-line px-4 py-3 text-sm">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="w-6 shrink-0 text-right font-semibold text-muted tabular-nums">{index + 1}.</span>
            <span className="min-w-0 flex-1 break-words">
              {step.instruction}
              {step.distance_m > 0 && <span className="text-muted"> · {routeDistanceText(step.distance_m)}</span>}
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}
