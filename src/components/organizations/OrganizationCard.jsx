import { LogOut, Star } from 'lucide-react'
import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

// Une organisation dont je suis membre (entrée de /auth/me) : ma relation, organisation par défaut, quota
export function OrganizationCard({ organization, onMakeDefault, makingDefault, onLeave }) {
  const { membership } = organization
  return (
    <li>
      <article className="grid gap-3 rounded-xl border border-line bg-surface px-5 py-4.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={membership.is_manager ? 'info' : 'neutral'}>
            {RELATIONSHIP_TYPE_LABELS[membership.relationship_type] ?? membership.relationship_type}
          </Badge>
          {membership.is_default && <Badge tone="success">Par défaut</Badge>}
          {organization.is_banned && <Badge tone="danger">Bannie</Badge>}
        </div>
        <div>
          <h3 className="text-[17px] font-bold">{organization.name}</h3>
          <p className="text-sm text-muted">{organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]}</p>
        </div>

        {organization.is_banned ? (
          <p className="text-sm text-danger">
            Cette organisation ne peut plus réserver{organization.banned_reason ? ` : ${organization.banned_reason}` : '.'}
          </p>
        ) : organization.is_priority ? (
          <p className="text-sm text-muted">Pas de quota annuel, approbation automatique des réservations.</p>
        ) : (
          <p className="text-sm text-muted">
            Réservations cette année : <strong className="text-ink">{organization.reservations_used_this_year}</strong> sur{' '}
            {organization.annual_quota}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!membership.is_default && (
            <Button variant="secondary" className="text-sm" onClick={() => onMakeDefault(organization)} loading={makingDefault}>
              <Star className="size-4" aria-hidden="true" /> Définir par défaut
            </Button>
          )}
          <Button variant="secondary" className="text-sm" onClick={() => onLeave(organization)}>
            <LogOut className="size-4" aria-hidden="true" /> Quitter
          </Button>
        </div>
      </article>
    </li>
  )
}
