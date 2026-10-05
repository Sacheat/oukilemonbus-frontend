import { Link } from 'react-router'
import { formatDateTime } from '../../lib/dates'
import { displayValue, formatDuration, httpStatusTone } from '../../lib/tooling'
import { Badge } from '../ui/Badge'
import { DetailList } from '../ui/DetailList'
import { FlowSheet } from './FlowSheet'

// Détail d'une entrée du journal : résumé, réponse (message et erreurs par champ), requête en libellé / valeur
// (mots de passe et jetons déjà masqués par le backend), contexte, fiche du flow et JSON brut repliable.
export function EntryDetails({ entry }) {
  const payload = entry.request_payload && typeof entry.request_payload === 'object' ? entry.request_payload : null
  const summary = entry.response_summary ?? {}
  const errors = summary.errors ? Object.entries(summary.errors) : []

  return (
    <>
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={httpStatusTone(entry.http_status)}>HTTP {entry.http_status}</Badge>
          <Badge tone={entry.outcome === 'success' ? 'success' : 'danger'}>{entry.outcome === 'success' ? 'Réussie' : 'En erreur'}</Badge>
        </div>
        <DetailList
          items={[
            ['Date', formatDateTime(entry.created_at)],
            ['Requête', <span className="font-mono text-xs break-all">{`${entry.method} ${entry.path}`}</span>],
            ['Route', entry.route_name],
            entry.route_params && ['Paramètres', displayValue(entry.route_params)],
            [
              'Compte',
              entry.user ? (
                <Link to={`?onglet=comptes&utilisateur=${entry.user.id}`} className="font-semibold text-link hover:underline">
                  {entry.user.email}
                </Link>
              ) : (
                'Sans compte connecté'
              ),
            ],
            ['Durée', formatDuration(entry.duration_ms)],
          ]}
        />
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Réponse</h3>
        {summary.message && <p className="text-sm">{summary.message}</p>}
        {errors.length > 0 && (
          <ul className="grid gap-1 text-sm">
            {errors.map(([field, messages]) => (
              <li key={field}>
                <span className="font-mono text-xs text-muted">{field}</span> : {[].concat(messages).join(' ')}
              </li>
            ))}
          </ul>
        )}
        {(summary.resource_id != null || summary.resource_status) && (
          <DetailList
            items={[
              summary.resource_id != null && ['Élément', `n° ${summary.resource_id}`],
              summary.resource_status && ['Statut', summary.resource_status],
            ]}
          />
        )}
        {!summary.message && errors.length === 0 && summary.resource_id == null && !summary.resource_status && (
          <p className="text-sm text-muted">Pas de résumé de réponse.</p>
        )}
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Données envoyées</h3>
        {payload && Object.keys(payload).length > 0 ? (
          <DetailList items={Object.entries(payload).map(([field, value]) => [field, <span className="break-all">{displayValue(value)}</span>])} />
        ) : (
          <p className="text-sm text-muted">Aucune donnée.</p>
        )}
      </section>

      {entry.meta && (
        <section className="grid gap-2 border-t border-line pt-5">
          <h3 className="font-bold">Contexte</h3>
          <DetailList
            items={[
              entry.meta.ip && ['Adresse IP', entry.meta.ip],
              entry.meta.idempotency_key && ['Idempotency-Key', <span className="font-mono text-xs break-all">{entry.meta.idempotency_key}</span>],
              entry.meta.user_agent && ['Navigateur', <span className="text-xs break-words">{entry.meta.user_agent}</span>],
            ]}
          />
        </section>
      )}

      {entry.flow && <FlowSheet flowKey={entry.flow_key} flow={entry.flow} />}

      <details className="border-t border-line pt-5">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-link">JSON brut de l’entrée</summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded-control bg-surface-muted p-3 text-xs">{JSON.stringify(entry, null, 2)}</pre>
      </details>
    </>
  )
}
