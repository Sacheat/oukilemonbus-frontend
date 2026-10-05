import { ArrowRight, LifeBuoy } from 'lucide-react'
import { Link } from 'react-router'
import { useDriverAlerts } from '../../hooks/useDriverAlerts'
import { formatDateTime } from '../../lib/dates'

// Bandeau rouge du tableau de bord : demandes d'aide en cours (ouvertes ou prises en charge), les 3 plus urgentes
// et le total, relues toutes les 60 s. Rien s'il n'y en a pas (ni pendant le chargement, ni en cas d'erreur).
export function OpenAlertsBanner() {
  const alerts = useDriverAlerts('ouverte,prise_en_charge', 1, 3)
  const alertList = alerts.data?.data
  if (!alertList || alertList.length === 0) return null
  const total = alerts.data.meta.total

  return (
    <section aria-labelledby="open-alerts-title" className="grid gap-3 rounded-panel border border-danger bg-danger-soft p-4 sm:p-5">
      <h2 id="open-alerts-title" className="flex items-center gap-2 text-lg font-bold">
        <LifeBuoy className="size-5 text-danger" aria-hidden="true" />
        {total > 1 ? `${total} demandes d’aide en cours` : 'Une demande d’aide en cours'}
      </h2>
      <ul className="grid gap-2">
        {alertList.map((alert) => (
          <li key={alert.id}>
            <Link
              to={`/gestion/alertes/${alert.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-surface px-3 py-2.5 hover:bg-surface-muted"
            >
              <span className="min-w-0">
                <strong>{alert.driver.name ?? 'Chauffeur'}</strong>
                {alert.vehicle && ` · ${alert.vehicle.licence_plate}`}
                <span className="text-sm text-muted">
                  {' '}
                  · {formatDateTime(alert.created_at)} · {alert.status === 'ouverte' ? 'à prendre en charge' : `pris en charge par ${alert.handled_by}`}
                </span>
              </span>
              <ArrowRight className="size-4 text-link" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {total > alertList.length && (
        <Link to="/gestion/alertes" className="text-sm font-semibold text-link">
          Voir toutes les demandes en cours
        </Link>
      )}
    </section>
  )
}
