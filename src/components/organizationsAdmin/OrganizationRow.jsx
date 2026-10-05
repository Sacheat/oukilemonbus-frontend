import { ArrowRight, CalendarClock, Users } from 'lucide-react'
import { Link } from 'react-router'
import { OrganizationAvatar } from '../organizations/OrganizationAvatar'
import { QuotaGauge } from '../organizations/QuotaGauge'
import { Badge } from '../ui/Badge'

// Une organisation dans la liste de /gestion/organisations : nom et type, membres, réservations à venir, quota de
// l'année (jauge) ou « sans quota », badge « Bannie ». Cliquable vers son panneau (`to` garde les filtres de l'URL).
export function OrganizationRow({ organization, to }) {
  const quota = organization.quota

  return (
    <li>
      <Link to={to} className="group grid gap-3 p-4 transition hover:bg-surface-muted sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:px-5">
        <span className="flex min-w-0 items-center gap-3">
          <OrganizationAvatar name={organization.name} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <strong className="break-words">{organization.name}</strong>
              {organization.is_banned && <Badge tone="danger">Bannie</Badge>}
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted">
              <span>{organization.type_label}</span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" aria-hidden="true" /> {organization.members_count} membre{organization.members_count > 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" aria-hidden="true" /> {organization.upcoming_reservations_count} à venir
              </span>
            </span>
          </span>
        </span>
        <span className="min-w-0">
          {quota?.exempt ? (
            <span className="text-sm text-muted">Sans quota annuel</span>
          ) : (
            <QuotaGauge used={quota?.used ?? 0} quota={quota?.limit ?? organization.annual_quota} />
          )}
        </span>
        <ArrowRight className="hidden size-4 text-link transition group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
      </Link>
    </li>
  )
}
