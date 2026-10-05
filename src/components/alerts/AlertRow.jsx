import { ArrowRight, LifeBuoy } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDateTime } from '../../lib/dates'
import { ALERT_STATUS_TONES, alertPlaceText } from '../../lib/driverAlerts'
import { Badge } from '../ui/Badge'

// Une demande d'aide dans une liste : statut, heure, chauffeur et bus, trajet, message, lieu. Cliquable vers sa page.
export function AlertRow({ alert }) {
  const open = alert.status !== 'cloturee'

  return (
    <li>
      <Link
        to={`/gestion/alertes/${alert.id}`}
        className="group flex flex-wrap items-start gap-x-4 gap-y-2 p-4 transition hover:bg-surface-muted sm:px-5"
      >
        <span
          aria-hidden="true"
          className={cx('grid size-11 shrink-0 place-items-center rounded-xl', open ? 'bg-danger-soft text-danger' : 'bg-neutral-soft text-muted')}
        >
          <LifeBuoy className="size-5" />
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={ALERT_STATUS_TONES[alert.status]}>{alert.status_label}</Badge>
            <span className="text-sm text-muted">n° {alert.id} · {formatDateTime(alert.created_at)}</span>
          </span>
          <span className="font-semibold">
            {alert.driver.name ?? 'Chauffeur'}
            {alert.vehicle && ` · ${alert.vehicle.licence_plate}`}
            {alert.reservation && ` · trajet n° ${alert.reservation.id} (${alert.reservation.organization ?? '—'})`}
          </span>
          {alert.message && <span className="text-sm break-words">« {alert.message} »</span>}
          <span className="text-sm text-muted">
            {alertPlaceText(alert)}
            {alert.handled_by && ` · pris en charge par ${alert.handled_by}`}
          </span>
        </span>
        <ArrowRight className="mt-3 size-4 text-link transition group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  )
}
