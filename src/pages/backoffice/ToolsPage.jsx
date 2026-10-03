import { useSearchParams } from 'react-router'
import { getFailedJobs } from '../../api/tooling'
import { AccountsTab } from '../../components/tooling/AccountsTab'
import { HealthTab } from '../../components/tooling/HealthTab'
import { JournalTab } from '../../components/tooling/JournalTab'
import { QueueTab } from '../../components/tooling/QueueTab'
import { SystemTab } from '../../components/tooling/SystemTab'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { DEFAULT_TOOL_TAB, readToolTab, TOOL_TABS } from '../../lib/tooling'

// Nombre de jobs en échec pour le badge de l'onglet (meta.total d'une page d'un élément ; pas toolbox/health,
// limité à 10 appels par minute)
function fetchFailedCount(signal) {
  return getFailedJobs({ per_page: 1 }, { signal }).then((page) => page.meta.total)
}

// Outils d'administration (admin, tooling.access) : santé du système, journal des requêtes (Inspector),
// diagnostic d'un compte et vue du système, en onglets (?onglet=). Chaque onglet garde ses filtres dans l'URL ;
// changer d'onglet repart d'une URL propre.
export function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = readToolTab(searchParams)
  const failedCount = useApi(fetchFailedCount)

  function changeTab(value) {
    setSearchParams(value === DEFAULT_TOOL_TAB ? {} : { onglet: value })
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Outils"
        description="Santé de la plateforme, journal des actions et diagnostic des comptes."
      />

      <div role="group" aria-label="Onglets" className="flex w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1">
        {TOOL_TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={tab === option.value}
            onClick={() => changeTab(option.value)}
            className={cx(
              'min-h-11 rounded-md px-3 text-sm font-semibold',
              tab === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {option.value === 'file' && failedCount.data > 0 && (
              <span
                className={cx(
                  'ml-1.5 inline-block min-w-5 rounded-full px-1.5 text-xs tabular-nums',
                  tab === option.value ? 'bg-on-primary/20' : 'bg-danger-soft text-danger',
                )}
              >
                {failedCount.data}
                <span className="sr-only"> jobs en échec</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'sante' && <HealthTab />}
      {tab === 'journal' && <JournalTab />}
      {tab === 'file' && <QueueTab onChanged={failedCount.reload} />}
      {tab === 'comptes' && <AccountsTab />}
      {tab === 'systeme' && <SystemTab />}
    </div>
  )
}
