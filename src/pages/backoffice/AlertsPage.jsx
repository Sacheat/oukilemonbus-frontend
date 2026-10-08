import { LifeBuoy } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { AlertRow } from '../../components/alerts/AlertRow'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { FilterChips } from '../../components/ui/FilterChips'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { getDriverAlerts } from '../../api/driverAlerts'
import { useApi } from '../../hooks/useApi'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useClock } from '../../hooks/useClock'
import { useDriverAlerts } from '../../hooks/useDriverAlerts'
import { ALERT_FILTERS, DEFAULT_ALERT_FILTER, readAlertSearch } from '../../lib/driverAlerts'

const EMPTY_TITLES = {
  'en-cours': 'Aucune demande d’aide en cours',
  cloturees: 'Aucune demande d’aide clôturée',
  toutes: 'Aucune demande d’aide',
}

// Nombre de demandes de chaque filtre (meta.total d'une requête par filtre) : { 'en-cours': 3, … }
async function fetchAlertCounts(signal) {
  const pages = await Promise.all(
    ALERT_FILTERS.map((option) => getDriverAlerts({ statuses: option.statuses.length ? option.statuses : undefined, per_page: 1 }, { signal })),
  )
  return Object.fromEntries(ALERT_FILTERS.map((option, index) => [option.value, pages[index].meta.total]))
}

// Demandes d'aide des chauffeurs (agent et admin) : en cours par défaut (ouvertes d'abord, puis prises en charge),
// clôturées, ou toutes, avec leur nombre ; filtrées et paginées par le backend (?statut=, ?page=), relues toutes les
// 60 s. Temps écoulé en direct (useClock) : « Sans réponse depuis 38 min » pour une demande ouverte.
export function AlertsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { filter, statuses, page } = readAlertSearch(searchParams)
  const alerts = useDriverAlerts(statuses.join(','), page)
  const counts = useApi(fetchAlertCounts)
  useAutoRefresh(counts.reload)
  const now = useClock()
  const alertList = alerts.loading ? undefined : alerts.data?.data

  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value)
      else next.delete(name)
    })
    setSearchParams(next)
  }

  let content
  if (alerts.error && !alertList) content = <ErrorState error={alerts.error} onRetry={alerts.reload} />
  else if (!alertList) content = <Loader />
  else if (alertList.length === 0) content = <EmptyState icon={LifeBuoy} title={EMPTY_TITLES[filter]} />
  else {
    content = (
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <ul className="divide-y divide-line">
          {alertList.map((alert) => (
            <AlertRow key={alert.id} alert={alert} now={now} />
          ))}
        </ul>
        <div className="border-t border-line p-4 empty:hidden">
          <Pagination meta={alerts.data.meta} onPageChange={(value) => updateSearch({ page: value > 1 ? String(value) : null })} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Flotte"
        title="Demandes d’aide"
        description="Pannes et problèmes signalés par les chauffeurs avec le bouton « Aide », avec leur position."
      />
      <FilterChips
        label="Statut"
        chips={ALERT_FILTERS.map(({ value, label }) => ({ value, label, count: counts.data?.[value] ?? null }))}
        value={filter}
        onChange={(value) => updateSearch({ statut: value === DEFAULT_ALERT_FILTER ? null : value, page: null })}
      />
      {content}
    </div>
  )
}
