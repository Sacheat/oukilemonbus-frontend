import { RESERVATION_STATUS_LABELS } from '../../lib/labels'
import { Badge } from './Badge'

const STATUS_TONES = {
  en_attente: 'warning',
  approuve: 'info',
  confirme: 'success',
  en_conflit: 'conflict',
  refuse: 'danger',
  annule: 'neutral',
}

// Statut d'une réservation. Passer `label` (status_label du backend) quand il est disponible.
export function StatusBadge({ status, label, className }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} className={className}>
      {label ?? RESERVATION_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
