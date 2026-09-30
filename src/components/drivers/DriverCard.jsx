import { formatDate } from '../../lib/dates'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LicenceBadge } from './LicenceBadge'

// Carte d'un chauffeur, cliquable en entier pour ouvrir le panneau de modification
export function DriverCard({ driver, onOpen }) {
  return (
    <Card
      as="button"
      type="button"
      onClick={() => onOpen(driver)}
      className="w-full text-left transition hover:border-line-strong hover:bg-surface-muted"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xl font-bold">{driver.user?.full_name ?? `Chauffeur n° ${driver.id}`}</p>
        <div className="flex flex-wrap gap-1.5">
          <LicenceBadge driver={driver} />
          {driver.is_active ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Désactivé</Badge>}
        </div>
      </div>
      {driver.user?.email && <p className="mt-1 text-sm break-words text-muted">{driver.user.email}</p>}
      <p className="mt-1 text-sm text-muted">
        Permis {driver.licence_number} · expire le {formatDate(driver.licence_expiry_date, { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </Card>
  )
}
