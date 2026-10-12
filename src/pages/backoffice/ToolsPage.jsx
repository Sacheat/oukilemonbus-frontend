import { useSearchParams } from 'react-router'
import { getFailedJobs } from '../../api/tooling'
import { AccountsTab } from '../../components/tooling/AccountsTab'
import { HealthTab } from '../../components/tooling/HealthTab'
import { JournalTab } from '../../components/tooling/JournalTab'
import { QueueTab } from '../../components/tooling/QueueTab'
import { SystemTab } from '../../components/tooling/SystemTab'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { useApi } from '../../hooks/useApi'
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

      <PageTabs
        label="Outils"
        options={TOOL_TABS.map((option) => ({
          ...option,
          ...(option.value === 'file' && failedCount.data > 0 && { count: failedCount.data, alert: true, countLabel: 'jobs en échec' }),
        }))}
        value={tab}
        onChange={changeTab}
      />

      {tab === 'sante' && <HealthTab />}
      {tab === 'journal' && <JournalTab />}
      {tab === 'file' && <QueueTab onChanged={failedCount.reload} />}
      {tab === 'comptes' && <AccountsTab />}
      {tab === 'systeme' && <SystemTab />}
    </div>
  )
}
