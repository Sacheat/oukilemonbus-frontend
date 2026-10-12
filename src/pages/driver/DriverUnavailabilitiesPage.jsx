import { CalendarOff } from 'lucide-react'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { getUnavailabilityPage } from '../../api/unavailabilities'
import { DriverUnavailabilityRow } from '../../components/driver/DriverUnavailabilityRow'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { periodCounts, readUnavailabilitySearch, unavailabilityListParams } from '../../lib/unavailabilities'

// Onglets du chauffeur : les annulées n'ont plus d'effet pour lui, elles ne sont pas affichées
const DRIVER_PERIODS = [
  { value: 'a-venir', label: 'En cours et à venir' },
  { value: 'passees', label: 'Passées' },
]

const EMPTY_TITLES = {
  'a-venir': 'Aucune indisponibilité en cours ou à venir',
  passees: 'Aucune indisponibilité passée',
}

// Mes indisponibilités (lecture seule : seuls les agents en déclarent). Onglet et page dans l'URL
// (?periode=passees&page=2). Le backend ne renvoie au chauffeur que les siennes, déjà rangées par onglet, triées et
// découpées en pages, avec les nombres des onglets (même règle que la page des agents).
export function DriverUnavailabilitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { period, page } = readUnavailabilitySearch(searchParams, DRIVER_PERIODS)
  const listKey = JSON.stringify(unavailabilityListParams({ period, page }))
  const fetchList = useCallback((signal) => getUnavailabilityPage(JSON.parse(listKey), { signal }), [listKey])
  const unavailabilities = useApi(fetchList)
  const unavailabilityList = unavailabilities.data?.data
  const counts = periodCounts(unavailabilities.data?.meta)
  const visibleList = unavailabilityList ?? []

  function showPeriod(value) {
    const next = new URLSearchParams(searchParams)
    if (value === 'a-venir') next.delete('periode')
    else next.set('periode', value)
    next.delete('page')
    setSearchParams(next)
  }

  function showPage(value) {
    const next = new URLSearchParams(searchParams)
    if (value > 1) next.set('page', String(value))
    else next.delete('page')
    setSearchParams(next)
  }

  let content
  if (unavailabilities.error) content = <ErrorState error={unavailabilities.error} onRetry={unavailabilities.reload} />
  else if (!unavailabilityList) content = <Loader />
  else if (visibleList.length === 0) content = <EmptyState icon={CalendarOff} title={EMPTY_TITLES[period]} />
  else {
    content = (
      <>
        <ul className="grid gap-3 md:grid-cols-2">
          {visibleList.map((unavailability) => (
            <li key={unavailability.id}>
              <DriverUnavailabilityRow unavailability={unavailability} />
            </li>
          ))}
        </ul>
        <Pagination meta={unavailabilities.data.meta} onPageChange={showPage} />
      </>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Espace chauffeur" title="Mes indisponibilités" />

      <Alert>Pour signaler une indisponibilité (maladie, absence…), contactez votre responsable.</Alert>

      <div role="group" aria-label="Période" className="flex w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1">
        {DRIVER_PERIODS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={period === option.value}
            onClick={() => showPeriod(option.value)}
            className={cx(
              'min-h-11 rounded-md px-4 text-sm font-semibold',
              period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {counts && ` (${counts[option.value]})`}
          </button>
        ))}
      </div>

      {content}
    </div>
  )
}
