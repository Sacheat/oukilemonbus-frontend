import { Inbox, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getRequests } from '../../api/requests'
import { useQueueCount } from '../../backoffice/useQueueCount'
import { RequestActions } from '../../components/requests/RequestActions'
import { RequestDetails } from '../../components/requests/RequestDetails'
import { RequestRow } from '../../components/requests/RequestRow'
import { Alert } from '../../components/ui/Alert'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input, Select } from '../../components/ui/Field'
import { FilterChips } from '../../components/ui/FilterChips'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { cx } from '../../lib/cx'
import { useApi } from '../../hooks/useApi'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { useRequest, useRequests } from '../../hooks/useRequests'
import {
  DEFAULT_REQUEST_QUEUE,
  DEFAULT_REQUEST_STATUS,
  readRequestsSearch,
  REQUEST_QUEUES,
  REQUEST_SORTS,
  REQUEST_STATUS_TABS,
  requestIdOf,
  requestsApiParams,
  statusTabOf,
} from '../../lib/requests'

const SEARCH_DELAY_MS = 300

// Nombre de demandes en attente de chaque file, pour les pastilles (meta.total d'une page d'un élément)
async function fetchPendingCounts(signal) {
  const pages = await Promise.all(
    REQUEST_QUEUES.map((queue) => getRequests(queue.kind, { statuses: ['en_attente'], per_page: 1 }, { signal })),
  )
  return Object.fromEntries(REQUEST_QUEUES.map((queue, index) => [queue.value, pages[index].meta.total]))
}

// Demandes (agents) : deux files, adhésions et nouvelles organisations (?file=), filtrées et triées par le backend
// (?statut=, ?tri=, ?type= pour les nouvelles organisations, ?q=, ?page=). La demande ouverte (?demande=id) est relue dans un panneau : détail, score de confiance, justificatif,
// Approuver (confirmé) ou Refuser (motif). Après une décision : panneau fermé, file et compteurs rechargés, message.
export function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readRequestsSearch(searchParams)
  const { queue, status, sort, type, openedId } = search
  const requests = useRequests(queue.kind, JSON.stringify(requestsApiParams(search)))
  const list = requests.data?.data
  const counts = useApi(fetchPendingCounts)
  const { refreshCount } = useQueueCount()
  const opened = useRequest(queue.kind, openedId)
  const [notice, setNotice] = useState(null)
  const [searchInput, setSearchInput] = useState(search.search)
  const searchTimer = useRef(null)

  function update(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    setSearchParams(next)
  }

  // Changer de file ou de statut : première page, panneau fermé
  function changeQueue(value) {
    setNotice(null)
    update({ file: value === DEFAULT_REQUEST_QUEUE ? null : value, type: null, page: null, demande: null })
  }

  // Le tri choisi reste ; s'il redevient celui du nouvel onglet, il quitte l'URL
  function changeStatus(value) {
    const nextSort = searchParams.get('tri') === statusTabOf(value).sort ? null : searchParams.get('tri')
    update({ statut: value === DEFAULT_REQUEST_STATUS ? null : value, tri: nextSort, page: null, demande: null })
  }

  function changeSort(value) {
    update({ tri: value === status.sort ? null : value, page: null })
  }

  function changeSearch(value) {
    setSearchInput(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => update({ q: value.trim(), page: null }), SEARCH_DELAY_MS)
  }
  useEffect(() => () => clearTimeout(searchTimer.current), [])

  function handleDecided(message) {
    update({ demande: null })
    requests.reload()
    counts.reload()
    refreshCount()
    setNotice(message)
  }

  const showStatus = status.value !== DEFAULT_REQUEST_STATUS
  const chips = REQUEST_QUEUES.map((item) => ({ value: item.value, label: item.label, count: counts.data?.[item.value] ?? null }))

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion"
        title="Demandes"
        description="Adhésions aux organisations et créations de nouvelles organisations, à valider ou refuser."
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="grid gap-3">
        <FilterChips label="Files" chips={chips} value={queue.value} onChange={changeQueue} />
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Statut" className="flex w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1">
            {REQUEST_STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={status.value === tab.value}
                onClick={() => changeStatus(tab.value)}
                className={cx(
                  'min-h-11 rounded-md px-3 text-sm font-semibold',
                  status.value === tab.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Rechercher une demande"
              placeholder={queue.kind === 'adhesion' ? 'Organisation, demandeur ou email' : 'Organisation, email, BCE ou demandeur'}
              value={searchInput}
              onChange={(event) => changeSearch(event.target.value)}
              className="py-2 pl-9 text-sm"
            />
          </div>
          {queue.kind === 'creation' && (
            <Select
              aria-label="Type d’organisation"
              value={type}
              onChange={(event) => update({ type: event.target.value, page: null })}
              className="w-full py-2 text-sm sm:w-56"
            >
              <option value="">Tous les types</option>
              {Object.entries(ORGANIZATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          <Select aria-label="Trier les demandes" value={sort} onChange={(event) => changeSort(event.target.value)} className="w-full py-2 text-sm sm:w-60">
            {REQUEST_SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {requests.error ? (
        <ErrorState error={requests.error} onRetry={requests.reload} />
      ) : !list ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState icon={Inbox} title={status.value === DEFAULT_REQUEST_STATUS && !search.search && !type ? 'Rien à traiter' : 'Aucune demande'}>
          {status.value === DEFAULT_REQUEST_STATUS && !search.search && !type
            ? 'Toutes les demandes de cette file ont été traitées.'
            : 'Modifiez la recherche, le type ou le statut.'}
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {requests.data.meta.total} {requests.data.meta.total > 1 ? 'demandes' : 'demande'}
          </p>
          <ul aria-busy={requests.loading} className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            {list.map((request) => {
              const id = requestIdOf(queue.kind, request)
              return (
                <RequestRow
                  key={id}
                  kind={queue.kind}
                  request={request}
                  showStatus={showStatus}
                  onOpen={() => {
                    setNotice(null)
                    update({ demande: String(id) })
                  }}
                />
              )
            })}
          </ul>
          <Pagination meta={requests.data.meta} onPageChange={(page) => update({ page: page > 1 ? String(page) : null })} />
        </>
      )}

      <Drawer
        open={Boolean(openedId)}
        onClose={() => update({ demande: null })}
        title={queue.kind === 'adhesion' ? 'Demande d’adhésion' : 'Création d’organisation'}
      >
        <div className="grid gap-6 p-5">
          {opened.error ? (
            <ErrorState error={opened.error} onRetry={opened.reload} />
          ) : opened.request ? (
            <>
              <RequestDetails kind={queue.kind} request={opened.request} />
              {opened.request.status === 'en_attente' && (
                <RequestActions key={openedId} kind={queue.kind} request={opened.request} onDecided={handleDecided} />
              )}
            </>
          ) : (
            <Loader />
          )}
        </div>
      </Drawer>
    </div>
  )
}
