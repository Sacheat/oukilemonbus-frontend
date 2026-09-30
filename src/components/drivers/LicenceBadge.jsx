import { getLicenceStatus } from '../../lib/drivers'
import { Badge } from '../ui/Badge'

// Alerte sur le permis : rien si valide, « expire bientôt » (moins de 30 jours) ou « expiré »
export function LicenceBadge({ driver }) {
  const licenceStatus = getLicenceStatus(driver)
  if (licenceStatus === 'expired') return <Badge tone="danger">Permis expiré</Badge>
  if (licenceStatus === 'expiring') return <Badge tone="warning">Permis expire bientôt</Badge>
  return null
}
