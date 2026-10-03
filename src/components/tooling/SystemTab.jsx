import { Link } from 'react-router'
import { getApiCatalog, getInspectorFlows, getPermissionMatrix, getToolboxOverview } from '../../api/tooling'
import { useApi } from '../../hooks/useApi'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { Panel } from '../ui/Panel'
import { FlowSheet } from './FlowSheet'
import { PermissionMatrix } from './PermissionMatrix'

function fetchOverview(signal) {
  return getToolboxOverview({ signal })
}
function fetchMatrix(signal) {
  return getPermissionMatrix({ signal })
}
function fetchFlows(signal) {
  return getInspectorFlows({ signal })
}
function fetchCatalog(signal) {
  return getApiCatalog({ signal })
}

// Contenu d'un panneau chargé à part : erreur, chargement ou contenu
function loaded(result, render) {
  if (result.error) return <ErrorState error={result.error} onRetry={result.reload} className="m-5" />
  if (!result.data) return <Loader className="px-5 py-6" />
  return render(result.data)
}

// Flows regroupés par catégorie, dans l'ordre alphabétique
function flowsByCategory(flows) {
  const groups = {}
  for (const [key, flow] of Object.entries(flows)) {
    ;(groups[flow.category ?? 'Autres'] ??= []).push({ key, flow })
  }
  return Object.entries(groups).sort(([first], [second]) => first.localeCompare(second, 'fr'))
}

// Onglet Système : chiffres de la base, règles métier actives, architecture, matrice des permissions,
// flows métier documentés (avec lien vers le journal filtré) et catalogue de l'API (routes internes, APIs externes)
export function SystemTab() {
  const overview = useApi(fetchOverview)
  const matrix = useApi(fetchMatrix)
  const flows = useApi(fetchFlows)
  const catalog = useApi(fetchCatalog)

  return (
    <div className="grid gap-7">
      {loaded(overview, (data) => (
        <div className="grid gap-7">
          <section aria-labelledby="db-title" className="grid gap-3">
            <h2 id="db-title" className="text-base font-bold">
              Base de données
            </h2>
            <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
              {data.db_stats.map((stat) => (
                <li key={stat.label} className="rounded-card border border-line bg-surface p-4 shadow-soft">
                  <span className="block text-2xl font-bold tabular-nums">{stat.count}</span>
                  <span className="text-sm text-muted">{stat.label}</span>
                </li>
              ))}
            </ul>
          </section>
          <div className="grid items-start gap-7 lg:grid-cols-2">
            <Panel title="Règles métier actives">
              <dl className="divide-y divide-line">
                {data.business_rules.map((rule) => (
                  <div key={rule.key} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                    <dt className="text-muted">{rule.label}</dt>
                    <dd className="font-bold tabular-nums">
                      {rule.value} {rule.unit}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Architecture du backend">
              <dl className="divide-y divide-line">
                {data.architecture.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                    <dt>
                      {item.label}
                      <span className="block font-mono text-xs text-muted">{item.path}</span>
                    </dt>
                    <dd className="font-bold tabular-nums">{item.count}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>
      ))}

      <Panel title="Permissions par rôle">{loaded(matrix, (data) => <PermissionMatrix data={data} />)}</Panel>

      <Panel title="Flows métier documentés">
        {loaded(flows, (data) => (
          <div className="divide-y divide-line">
            {flowsByCategory(data.flows).map(([category, items]) => (
              <details key={category} className="group px-5 py-2">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 font-semibold">
                  {category}
                  <span className="text-sm font-normal text-muted">{items.length}</span>
                </summary>
                <div className="grid gap-4 pb-3">
                  {items.map(({ key, flow }) => (
                    <div key={key} className="grid gap-1">
                      <FlowSheet flowKey={key} flow={flow} />
                      <Link to={`?onglet=journal&flow=${encodeURIComponent(key)}`} className="text-sm font-semibold text-link hover:underline">
                        Voir ses entrées dans le journal
                      </Link>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ))}
      </Panel>

      <Panel title="Catalogue de l’API">
        {loaded(catalog, (data) => (
          <div className="grid gap-5 p-5">
            <section className="grid gap-3">
              <h3 className="font-bold">APIs externes</h3>
              <ul className="grid gap-3 lg:grid-cols-3">
                {data.external.map((service) => (
                  <li key={service.name} className="grid gap-1 rounded-card border border-line p-4 text-sm">
                    <span className="font-semibold">{service.name}</span>
                    <span>{service.used_for}</span>
                    <code className="text-xs break-all text-muted">{service.url}</code>
                    {service.fallback && <span className="text-muted">Repli : {service.fallback}</span>}
                    {service.env_key && <span className="text-xs text-muted">Clé : {service.env_key}</span>}
                  </li>
                ))}
              </ul>
            </section>
            <section className="grid gap-2">
              <h3 className="font-bold">Routes internes</h3>
              <div className="divide-y divide-line rounded-card border border-line">
                {Object.entries(data.internal).map(([domain, routes]) => (
                  <details key={domain} className="px-4 py-1.5">
                    <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold">
                      {domain}
                      <span className="font-normal text-muted">{routes.length}</span>
                    </summary>
                    <ul className="grid gap-1 pb-2">
                      {routes.map((route) => (
                        <li key={`${route.method} ${route.uri}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                          <span className="w-14 font-mono font-semibold">{route.method}</span>
                          <code className="min-w-0 flex-1 break-all">{route.uri}</code>
                          {route.permission && <code className="text-muted">{route.permission}</code>}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          </div>
        ))}
      </Panel>
    </div>
  )
}
