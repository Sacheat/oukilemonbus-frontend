import { CalendarClock } from 'lucide-react'
import { formatLocalRange, formatTime } from '../../../lib/dates'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'

// Distance, durée et créneau pendant lequel le bus est bloqué (retour et marges compris)
export function TripFacts({ result }) {
  const occupation = result.estimated_occupation
  const items = [
    result.distance_km != null && ['Distance', `${Number(result.distance_km).toLocaleString('fr-BE')} km`],
    result.estimated_duration_min != null && ['Trajet estimé', `${result.estimated_duration_min} min`],
    occupation && ['Bus réservé', formatLocalRange(occupation.start_at, occupation.end_at)],
  ].filter(Boolean)

  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// Bus déjà pris sur le créneau : proposition du prochain créneau libre en un clic
export function AvailabilityNotice({ availability, onUseSlot }) {
  if (!availability || availability.is_available) return null
  const departure = availability.next_available_departure_time
  const returnTime = availability.next_available_return_time
  return (
    <Alert tone="warning" title="Le bus n’est pas libre sur ce créneau">
      {availability.message && <p>{availability.message}</p>}
      {departure && returnTime && onUseSlot && (
        <Button variant="secondary" className="mt-2 text-sm" onClick={() => onUseSlot(formatTime(departure), formatTime(returnTime))}>
          <CalendarClock className="size-4" aria-hidden="true" /> Utiliser {formatTime(departure)} → {formatTime(returnTime)}
        </Button>
      )}
    </Alert>
  )
}

// Avertissements de dérogation (non bloquants, soumis au Collège)
export function WarningsList({ warnings }) {
  if (!warnings?.length) return null
  return (
    <Alert tone="warning" title="Dérogation nécessaire">
      <ul className="mt-1 list-disc pl-5">
        {warnings.map((warning) => (
          <li key={warning.type}>{warning.message}</li>
        ))}
      </ul>
    </Alert>
  )
}

// Problèmes qui mettront la réservation « en conflit » (traités ensuite par la commune)
export function ConflictsList({ conflicts }) {
  if (!conflicts?.length) return null
  return (
    <Alert tone="warning" title="Points qui devront être réglés par la commune">
      <ul className="mt-1 list-disc pl-5">
        {conflicts.map((conflict, index) => (
          <li key={`${conflict.type}-${index}`}>{conflict.message}</li>
        ))}
      </ul>
    </Alert>
  )
}

// Ce qui se passera après l'envoi
export function ApprovalNotice({ result }) {
  if (result.approval_type === 'auto') {
    return (
      <Alert tone="success" title="Approbation automatique">
        Cette demande sera approuvée dès l’envoi, puis le chauffeur et le véhicule seront affectés.
      </Alert>
    )
  }
  return (
    <Alert tone="info" title="Validation par la commune">
      Cette demande sera examinée par la commune et soumise à la décision du Collège. Vous serez averti de la
      décision.
    </Alert>
  )
}
