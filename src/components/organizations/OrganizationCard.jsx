import { ArrowRight, LogOut, Star } from 'lucide-react'
import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { OrganizationAvatar } from './OrganizationAvatar'
import { QuotaGauge } from './QuotaGauge'

// Une organisation dont je suis membre (entrée de /auth/me), façon carte de membre : pastille aux initiales,
// nom, type et ma relation, organisation par défaut (étoile), quota annuel en jauge, puis les actions
export function OrganizationCard({ organization, onMakeDefault, makingDefault, onLeave }) {
  const { membership } = organization
  return (
    <li className="min-w-0">
      <article className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
        <div className="flex gap-4 p-5">
          <OrganizationAvatar name={organization.name} />
          <div className="min-w-0 flex-1">
            <h3 className="flex items-start gap-2 text-[17px] font-bold">
              <span className="min-w-0 break-words">{organization.name}</span>
              {membership.is_default && (
                <Star className="mt-1 size-4 shrink-0 fill-accent text-accent" aria-label="Organisation par défaut" />
              )}
            </h3>
            <p className="text-sm text-muted">{organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={membership.is_manager ? 'info' : 'neutral'}>
                {RELATIONSHIP_TYPE_LABELS[membership.relationship_type] ?? membership.relationship_type}
              </Badge>
              {membership.is_default && <Badge tone="warning">Par défaut</Badge>}
              {organization.is_banned && <Badge tone="danger">Bannie</Badge>}
            </div>
          </div>
        </div>

        <div className="px-5 pb-4">
          {organization.is_banned ? (
            <p className="text-sm text-danger">
              Cette organisation ne peut plus réserver{organization.banned_reason ? ` : ${organization.banned_reason}` : '.'}
            </p>
          ) : organization.is_priority ? (
            <p className="text-sm text-muted">Sans quota annuel · réservations approuvées automatiquement.</p>
          ) : (
            <QuotaGauge used={organization.reservations_used_this_year} quota={organization.annual_quota} />
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line bg-surface-muted px-5 py-3">
          <Button className="text-sm" to={`/espace/organisations/${organization.id}`} aria-label={`Voir ${organization.name}`}>
            {membership.is_manager ? 'Voir et gérer les membres' : 'Voir'} <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
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
