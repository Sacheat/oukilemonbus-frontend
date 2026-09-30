import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { organizationInitials } from '../../lib/organizations'
import { trackSpotlight } from '../../lib/spotlight'
import { Badge } from '../ui/Badge'

// En-tête du détail d'une organisation, dans le style des bandeaux de déplacement : talon aux initiales,
// nom, type, ma relation (et « Par défaut »), bannissement ; les actions (children) se placent à droite
export function OrganizationHero({ organization, membership = null, children }) {
  return (
    <section
      aria-labelledby="organization-title"
      onPointerMove={trackSpotlight}
      className="spotlight spotlight-warm flex flex-col overflow-hidden rounded-panel bg-hero text-white shadow-soft sm:flex-row"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="relative grid shrink-0 place-content-center bg-accent px-6 py-5 text-4xl font-extrabold text-on-accent sm:w-32"
      >
        {organizationInitials(organization.name)}
      </div>

      <div className="grid min-w-0 flex-1 items-center gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Organisation</p>
          <h1 id="organization-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight break-words sm:text-[30px]">
            {organization.name}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-nav-ink">{organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]}</span>
            {membership && (
              <Badge tone={membership.is_manager ? 'info' : 'neutral'}>
                {RELATIONSHIP_TYPE_LABELS[membership.relationship_type] ?? membership.relationship_type}
              </Badge>
            )}
            {membership?.is_default && <Badge tone="warning">Par défaut</Badge>}
            {organization.is_banned && <Badge tone="danger">Bannie</Badge>}
          </div>
        </div>

        {children && <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">{children}</div>}
      </div>
    </section>
  )
}
