import { Ban, Building2, Bus, CalendarClock, CircleCheck, CircleX, FileText, TriangleAlert, Users } from 'lucide-react'
import { cx } from '../../lib/cx'
import { notificationKind } from '../../lib/notifications'

// Icône et couleurs (tokens de la DA) de chaque nature de notification
const KINDS = {
  approved: { icon: CircleCheck, colors: 'bg-success-soft text-success' },
  refused: { icon: CircleX, colors: 'bg-danger-soft text-danger' },
  cancelled: { icon: Ban, colors: 'bg-neutral-soft text-neutral' },
  passengers: { icon: Users, colors: 'bg-info-soft text-info' },
  document: { icon: FileText, colors: 'bg-info-soft text-info' },
  conflict: { icon: TriangleAlert, colors: 'bg-conflict-soft text-conflict' },
  organization: { icon: Building2, colors: 'bg-soft text-link' },
  planning: { icon: CalendarClock, colors: 'bg-soft text-link' },
  reservation: { icon: Bus, colors: 'bg-soft text-link' },
}

// Pastille d'icône d'une notification (décorative : le titre dit de quoi il s'agit) ;
// une notification prioritaire est cerclée de rouge
export function NotificationIcon({ data, compact = false }) {
  const { icon: Icon, colors } = KINDS[notificationKind(data)]
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center rounded-full',
        compact ? 'size-8' : 'size-10',
        colors,
        data.priority === 'high' && 'ring-2 ring-danger',
      )}
    >
      <Icon className={compact ? 'size-4' : 'size-5'} />
    </span>
  )
}
