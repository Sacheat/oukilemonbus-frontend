import { formatDate } from '../../lib/dates'
import { FleetDayStatus } from '../fleet/FleetDayStatus'
import { Badge } from '../ui/Badge'
import { LicenceBadge } from './LicenceBadge'

// Carte d'un chauffeur : le haut, cliquable, ouvre le panneau de modification ; dessous, l'état du jour
// (`dayState` : fleetDayState, absent pour un chauffeur désactivé) et le lien vers le Planning du jour.
export function DriverCard({ driver, onOpen, dayState, planningHref }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <button type="button" onClick={() => onOpen(driver)} className="w-full p-5.5 text-left transition hover:bg-surface-muted">
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span className="text-xl font-bold">{driver.user?.full_name ?? `Chauffeur n° ${driver.id}`}</span>
          <span className="flex flex-wrap gap-1.5">
            <LicenceBadge driver={driver} />
            {driver.is_active ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Désactivé</Badge>}
          </span>
        </span>
        {driver.user?.email && <span className="mt-1 block text-sm break-words text-muted">{driver.user.email}</span>}
        <span className="mt-1 block text-sm text-muted">
          Permis {driver.licence_number} · expire le{' '}
          {formatDate(driver.licence_expiry_date, { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </button>
      {driver.is_active && <FleetDayStatus state={dayState} planningHref={planningHref} />}
    </div>
  )
}
