import { Link } from 'react-router'
import { RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { Badge } from '../ui/Badge'

// Organisations du compte et profil chauffeur, en lecture seule, utiles avant de changer un rôle.
// Affichés seulement si le backend les renvoie (`organizations`, `driver` chargés) ; rien sinon.
export function UserContext({ user, canSeeDrivers }) {
  const organizations = user.organizations
  const hasDriver = user.driver !== undefined
  if (organizations === undefined && !hasDriver) return null

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Rattachements</h3>
      {organizations !== undefined &&
        (organizations.length === 0 ? (
          <p className="text-sm text-muted">Membre d’aucune organisation.</p>
        ) : (
          <ul className="grid gap-1.5 text-sm">
            {organizations.map((organization) => (
              <li key={organization.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{organization.name}</span>
                <Badge tone="neutral">
                  {RELATIONSHIP_TYPE_LABELS[organization.membership?.relationship_type] ?? 'Membre'}
                </Badge>
              </li>
            ))}
          </ul>
        ))}
      {hasDriver && user.driver && (
        <p className="text-sm">
          Profil chauffeur {user.driver.is_active ? 'actif' : 'désactivé'}
          {user.driver.licence_number && ` (permis ${user.driver.licence_number})`}
          {canSeeDrivers && (
            <>
              {' · '}
              <Link to="/gestion/chauffeurs" className="font-semibold text-link hover:underline">
                Voir les chauffeurs
              </Link>
            </>
          )}
        </p>
      )}
    </section>
  )
}
