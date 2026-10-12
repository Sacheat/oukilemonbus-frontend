import { Link } from 'react-router'
import { formatDateTime } from '../../lib/dates'
import { RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { permissionGroups, utcStamp } from '../../lib/tooling'
import { ROLE_TONES, sortedRoles } from '../../lib/users'
import { OrganizationAvatar } from '../organizations/OrganizationAvatar'
import { Badge } from '../ui/Badge'
import { DetailList } from '../ui/DetailList'
import { Panel } from '../ui/Panel'

// Fiche de diagnostic d'un compte (GET /inspector/users/{id}) : en-tête (identité, rôles, état), organisation par défaut,
// ce que le compte peut faire (capacités en clair et permissions effectives par domaine) et son activité
// dans le journal, avec des liens vers le journal filtré et vers la page Utilisateurs.
export function AccountSheet({ sheet }) {
  const journal = `?onglet=journal&compte=${sheet.id}`
  const stats = sheet.inspector ?? {}

  return (
    <div className="grid gap-6">
      <section aria-label={`Compte de ${sheet.name}`} className="flex flex-wrap items-start gap-4 rounded-card border border-line bg-surface p-5 shadow-soft">
        <OrganizationAvatar name={sheet.name} className="size-12 rounded-full" />
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold break-words">{sheet.name}</h2>
            <p className="text-sm break-all text-muted">{sheet.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortedRoles(sheet.roles).map((role) => (
              <Badge key={role.value} tone={ROLE_TONES[role.value]}>
                {role.label}
              </Badge>
            ))}
            {sheet.roles?.length === 0 && <Badge tone="warning">Aucun rôle</Badge>}
            {!sheet.active && <Badge tone="neutral">Désactivé</Badge>}
            {!sheet.email_verified_at && <Badge tone="warning">Email non vérifié</Badge>}
          </div>
        </div>
        <Link to={`/gestion/utilisateurs?utilisateur=${sheet.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline">
          Ouvrir dans Utilisateurs
        </Link>
      </section>

      <div className="grid items-start gap-7 lg:grid-cols-2">
        <Panel title="Ce que le compte peut faire">
          <div className="grid gap-4 p-5">
            <DetailList
              items={[
                sheet.email_verified_at && ['Email vérifié le', formatDateTime(sheet.email_verified_at)],
                [
                  'Organisation par défaut',
                  sheet.organization
                    ? `${sheet.organization.name} (${RELATIONSHIP_TYPE_LABELS[sheet.organization.relationship_type] ?? 'Membre'})`
                    : 'Aucune',
                ],
              ]}
            />
            <section className="grid gap-2 border-t border-line pt-4">
              <h3 className="font-bold">Peut</h3>
              {sheet.capabilities?.length > 0 ? (
                <ul className="grid list-disc gap-1 pl-5 text-sm">
                  {sheet.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Aucune action particulière.</p>
              )}
            </section>
            <section className="grid gap-2 border-t border-line pt-4">
              <h3 className="font-bold">Activité dans le journal</h3>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted">Actions</dt>
                  <dd className="text-xl font-bold tabular-nums">{stats.entries_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-muted">En erreur</dt>
                  <dd className="text-xl font-bold tabular-nums">{stats.errors_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-muted">Dernière</dt>
                  <dd className="font-semibold">{stats.latest_entry_at ? formatDateTime(utcStamp(stats.latest_entry_at)) : '—'}</dd>
                </div>
              </dl>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link to={journal} className="font-semibold text-link hover:underline">
                  Voir ses actions
                </Link>
                {stats.errors_count > 0 && (
                  <Link to={`${journal}&resultat=error`} className="font-semibold text-link hover:underline">
                    Voir ses erreurs
                  </Link>
                )}
              </p>
            </section>
          </div>
        </Panel>

        <Panel title={`Permissions effectives · ${sheet.permissions?.length ?? 0}`}>
          <dl className="divide-y divide-line">
            {permissionGroups(sheet.permissions).map((group) => (
              <div key={group.domain} className="grid gap-1.5 px-5 py-2.5 text-sm sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
                <dt className="font-mono text-xs font-semibold">{group.domain}</dt>
                <dd className="flex flex-wrap gap-1">
                  {group.items.map((item) => (
                    <code key={item.permission} className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                      {item.action}
                    </code>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  )
}
