import { CalendarOff } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { getAllUnavailabilities } from '../../api/unavailabilities'
import { DriverUnavailabilityRow } from '../../components/driver/DriverUnavailabilityRow'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { countByPeriod, unavailabilitiesForPeriod } from '../../lib/unavailabilities'

// Onglets du chauffeur : les annulées n'ont plus d'effet pour lui, elles ne sont pas affichées
const DRIVER_PERIODS = [
  { value: 'a-venir', label: 'En cours et à venir' },
  { value: 'passees', label: 'Passées' },
]

const EMPTY_TITLES = {
  'a-venir': 'Aucune indisponibilité en cours ou à venir',
  passees: 'Aucune indisponibilité passée',
}

// Le backend ne renvoie au chauffeur que ses indisponibilités ; il ne filtre pas : on range côté front
// avec les mêmes règles que la page des agents (lib/unavailabilities.js). Défini hors du composant : fetcher stable.
function fetchUnavailabilities(signal) {
  return getAllUnavailabilities({ signal })
}

// Mes indisponibilités (lecture seule : seuls les agents en déclarent). Onglet dans l'URL (?periode=passees).
export function DriverUnavailabilitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('periode') === 'passees' ? 'passees' : 'a-venir'
  const unavailabilities = useApi(fetchUnavailabilities)
  const unavailabilityList = unavailabilities.data
  const counts = unavailabilityList ? countByPeriod(unavailabilityList) : null
  const visibleList = unavailabilityList ? unavailabilitiesForPeriod(unavailabilityList, period) : []

  function showPeriod(value) {
    const next = new URLSearchParams(searchParams)
    if (value === 'a-venir') next.delete('periode')
    else next.set('periode', value)
    setSearchParams(next)
  }

  let content
  if (unavailabilities.error) content = <ErrorState error={unavailabilities.error} onRetry={unavailabilities.reload} />
  else if (!unavailabilityList) content = <Loader />
  else if (visibleList.length === 0) content = <EmptyState icon={CalendarOff} title={EMPTY_TITLES[period]} />
  else {
    content = (
      <ul className="grid gap-3 md:grid-cols-2">
        {visibleList.map((unavailability) => (
          <li key={unavailability.id}>
            <DriverUnavailabilityRow unavailability={unavailability} />
          </li>
        ))}
      </ul>
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
