import { CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { getInspectorStatus, getNotificationsHealth, getSystemHealth } from '../../api/tooling'
import { useApi } from '../../hooks/useApi'
import { useClock } from '../../hooks/useClock'
import { cx } from '../../lib/cx'
import { formatDateTime, formatRelative } from '../../lib/dates'
import { checkStatus, formatDuration, healthChecks, NOTIFICATION_METRICS, utcStamp } from '../../lib/tooling'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/ErrorState'
import { Panel } from '../ui/Panel'
import { Skeleton } from '../ui/Skeleton'

// Heure de la réponse gardée avec les contrôles, pour « Contrôlé il y a … »
function fetchHealth(signal) {
  return getSystemHealth({ signal }).then((data) => ({ ...data, checkedAt: new Date().toISOString() }))
}
function fetchNotifications(signal) {
  return getNotificationsHealth({ signal })
}
function fetchInspector(signal) {
  return getInspectorStatus({ signal })
}

// Onglet Santé : contrôles du système (lents : APIs externes, 10 appels par minute au plus), envois d'emails et
// état du journal. « Relancer les contrôles » recharge les trois ; l'affichage reste en place pendant le rechargement.
// Heure du dernier contrôle en direct ; les contrôles à surveiller du bandeau mènent à leur carte.
export function HealthTab() {
  const now = useClock()
  const health = useApi(fetchHealth)
  const notifications = useApi(fetchNotifications)
  const inspector = useApi(fetchInspector)
  const checks = health.data ? healthChecks(health.data.checks) : null
  const warnings = checks?.filter((check) => check.status !== 'ok') ?? []

  function reloadAll() {
    health.reload()
    notifications.reload()
    inspector.reload()
  }

  return (
    <div className="grid gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {health.data ? (
          <p
            className={cx(
              'flex items-center gap-2 rounded-card px-4 py-3 text-sm font-semibold',
              health.data.healthy && warnings.length === 0 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
            )}
          >
            {health.data.healthy && warnings.length === 0 ? (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            ) : (
              <TriangleAlert className="size-5" aria-hidden="true" />
            )}
            {warnings.length === 0 ? (
              'Tous les contrôles sont au vert.'
            ) : (
              <span>
                {warnings.length} {warnings.length > 1 ? 'contrôles demandent' : 'contrôle demande'} votre attention :{' '}
                {warnings.map((check, index) => (
                  <span key={check.key}>
                    {index > 0 && ', '}
                    <a href={`#controle-${check.key}`} className="underline underline-offset-2 hover:no-underline">
                      {check.label}
                    </a>
                  </span>
                ))}
                .
              </span>
            )}
          </p>
        ) : (
          <Skeleton className="h-11 w-80 max-w-full rounded-card" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          {health.data && (
            <p className="text-sm text-muted" aria-live="polite">
              Contrôlé {formatRelative(health.data.checkedAt, now)}
            </p>
          )}
          <Button variant="secondary" onClick={reloadAll} loading={health.loading}>
            <RefreshCw className="size-4" aria-hidden="true" /> Relancer les contrôles
          </Button>
        </div>
      </div>

      {health.error && <ErrorState error={health.error} onRetry={health.reload} />}

      <section aria-labelledby="checks-title" className="grid gap-3">
        <h2 id="checks-title" className="text-base font-bold">
          Contrôles du système
        </h2>
        <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {checks
            ? checks.map((check) => {
                const status = checkStatus(check.status)
                return (
                  <li
                    key={check.key}
                    id={`controle-${check.key}`}
                    className={cx(
                      'grid scroll-mt-24 content-start gap-1.5 rounded-card border bg-surface p-4 shadow-soft',
                      check.status === 'ok' ? 'border-line' : status.tone === 'danger' ? 'border-danger' : 'border-warning-line',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{check.label}</span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <p className="text-sm break-words text-muted">{check.details}</p>
                    {check.duration_ms != null && (
                      <p className="text-xs text-muted tabular-nums">Réponse en {formatDuration(check.duration_ms)}</p>
                    )}
                    {check.key === 'queue' && check.failed_jobs > 0 && (
                      <Link to="?onglet=file" className="text-sm font-semibold text-link hover:underline">
                        Voir les {check.failed_jobs} jobs en échec
                      </Link>
                    )}
                  </li>
                )
              })
            : !health.error &&
              Array.from({ length: 6 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-24 rounded-card" />
                </li>
              ))}
        </ul>
      </section>

      <div className="grid gap-7 lg:grid-cols-2">
        <Panel
          title="Envois d’emails"
          action={notifications.data && <Badge tone={checkStatus(notifications.data.status).tone}>{checkStatus(notifications.data.status).label}</Badge>}
        >
          {notifications.error ? (
            <ErrorState error={notifications.error} onRetry={notifications.reload} className="m-5" />
          ) : (
            <dl className="divide-y divide-line">
              {NOTIFICATION_METRICS.map((metric) => (
                <div key={metric.key} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <dt className="text-muted">{metric.label}</dt>
                  <dd className="font-bold tabular-nums">{notifications.data ? notifications.data.data[metric.key] : '…'}</dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>

        <Panel
          title="Journal (Inspector)"
          action={
            <Link to="?onglet=journal" className="text-sm font-semibold text-link hover:underline">
              Ouvrir le journal
            </Link>
          }
        >
          {inspector.error ? (
            <ErrorState error={inspector.error} onRetry={inspector.reload} className="m-5" />
          ) : (
            <dl className="divide-y divide-line">
              {[
                ['Enregistrement', inspector.data && (inspector.data.enabled ? 'Activé' : 'Désactivé')],
                ['Entrées', inspector.data?.entries_count],
                ['Conservation', inspector.data && `${inspector.data.retention_days} jours`],
                ['Plus ancienne', inspector.data && formatDateTime(utcStamp(inspector.data.oldest_entry_at))],
                ['Plus récente', inspector.data && formatDateTime(utcStamp(inspector.data.latest_entry_at))],
                ['Flows documentés', inspector.data?.flows_count],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-bold tabular-nums">{value ?? '…'}</dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>
      </div>
    </div>
  )
}
