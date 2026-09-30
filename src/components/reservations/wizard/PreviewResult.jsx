import { CalendarClock } from 'lucide-react'
import { formatTime } from '../../../lib/dates'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'

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
