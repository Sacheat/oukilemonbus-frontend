import { Bus, UserRound } from 'lucide-react'
import { formatUtcRange } from '../../lib/dates'
import { isActiveUnavailability, isOngoing, REASON_TYPE_LABELS } from '../../lib/unavailabilities'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

// Une indisponibilité dans la liste, cliquable en entier pour ouvrir le panneau.
// `subject` : nom du chauffeur ou plaque du véhicule, calculé par la page.
export function UnavailabilityRow({ unavailability, subject, onOpen }) {
  const Icon = unavailability.reason_type === 'driver' ? UserRound : Bus

  return (
    <Card
      as="button"
      type="button"
      onClick={() => onOpen(unavailability)}
      className="flex w-full items-start gap-4 text-left transition hover:border-line-strong hover:bg-surface-muted"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-muted text-muted">
        <Icon className="size-5" aria-hidden="true" />
        <span className="sr-only">{REASON_TYPE_LABELS[unavailability.reason_type]}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold">{subject}</span>
          {!isActiveUnavailability(unavailability) && <Badge tone="neutral">Annulée</Badge>}
          {isOngoing(unavailability) && <Badge tone="warning">En cours</Badge>}
        </span>
        <span className="mt-1 block text-sm first-letter:uppercase">
          {formatUtcRange(unavailability.start_datetime, unavailability.end_datetime)}
        </span>
        {unavailability.reason && <span className="mt-1 block text-sm break-words text-muted">{unavailability.reason}</span>}
      </span>
    </Card>
  )
}
