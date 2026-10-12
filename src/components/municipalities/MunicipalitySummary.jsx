import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { referencePoint } from '../../lib/municipalities'
import { weekdayLabel } from '../../lib/weeklyPlanning'
import { Badge } from '../ui/Badge'

// En-tête de la commune active : identité et ce qui s'applique aujourd'hui (repère des distances, limites, localités ;
// pour l'admin : planning hebdomadaire et contact de garde). Chaque tuile mène à l'onglet où la régler.
export function MunicipalitySummary({ municipality, isAdmin }) {
  const point = referencePoint(municipality, municipality.depot_location)
  const localities = municipality.localities ?? []
  const activeLocalities = localities.filter((locality) => locality.is_active).length

  const facts = [
    {
      tab: 'regles',
      label: 'Repère des distances',
      value: point ? point.label : 'Ni dépôt ni centre connu',
      warning: !point,
    },
    { tab: 'regles', label: 'Lieu de départ', value: `${municipality.effective_max_pickup_distance_km} km au plus` },
    { tab: 'regles', label: 'Trajet', value: `${municipality.effective_max_trip_distance_km} km au plus` },
    {
      tab: 'localites',
      label: 'Localités',
      value: `${activeLocalities} active${activeLocalities > 1 ? 's' : ''} sur ${localities.length}`,
      warning: activeLocalities === 0,
    },
    isAdmin && {
      tab: 'planning',
      label: 'Planning hebdomadaire',
      value: municipality.effective_weekly_planning_enabled
        ? `${weekdayLabel(municipality.effective_weekly_planning_send_day)} à ${municipality.effective_weekly_planning_send_time}`
        : 'Envoi désactivé',
    },
    isAdmin && {
      tab: 'chauffeurs',
      label: 'Contact de garde',
      value: municipality.on_call_name || municipality.on_call_email || 'Aucun',
    },
  ].filter(Boolean)

  return (
    <section aria-labelledby="commune-active" className="grid gap-4 rounded-card border border-line bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="commune-active" className="text-xl font-bold">
          {municipality.name}
        </h2>
        <Badge tone="success">Commune active</Badge>
        <span className="text-sm text-muted">
          {[municipality.postal_code, municipality.nis_code && `INS ${municipality.nis_code}`].filter(Boolean).join(' · ')}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
        {facts.map((fact) => (
          <li key={fact.label}>
            <Link
              to={`?onglet=${fact.tab}`}
              className={cx(
                'grid min-h-11 gap-0.5 rounded-control border px-3.5 py-2.5 text-sm transition-colors hover:border-primary',
                fact.warning ? 'border-warning-line bg-warning-soft' : 'border-line bg-surface-muted',
              )}
            >
              <span className="text-xs text-muted">{fact.label}</span>
              <span className={cx('font-semibold break-words', fact.warning && 'text-warning')}>{fact.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
