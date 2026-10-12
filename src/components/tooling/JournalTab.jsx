import { ScrollText, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useInspectorEntry } from '../../hooks/useInspectorEntry'
import { useInspectorEntries } from '../../hooks/useInspectorEntries'
import { cx } from '../../lib/cx'
import {
  activeJournalPeriod,
  isJournalFiltered,
  JOURNAL_FILTER_PARAMS,
  journalApiParams,
  journalPeriods,
  METHODS,
  moreJournalFilterCount,
  OUTCOME_FILTERS,
  readJournalSearch,
} from '../../lib/tooling'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Input, Select } from '../ui/Field'
import { FilterChips } from '../ui/FilterChips'
import { Loader } from '../ui/Loader'
import { Pagination } from '../ui/Pagination'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Toast } from '../ui/Toast'
import { EntryDetails } from './EntryDetails'
import { JournalRow } from './JournalRow'
import { PurgeJournalModal } from './PurgeJournalModal'

const SEARCH_DELAY_MS = 300
const HTTP_STATUSES = ['200', '201', '202', '204', '401', '403', '404', '409', '419', '422', '429', '500']

// Onglet Journal : requêtes qui modifient des données, filtrées par le backend (?email=, ?compte=, ?resultat=,
// ?methode=, ?code=, ?du=, ?au=, ?flow=, ?page=), entrée ouverte dans un panneau (?entree=id, relue avec la fiche
// complète de son flow, mise en évidence dans la liste) et purge confirmée (message temporaire après).
// Petit écran : méthode, code et dates repliés derrière « Filtres » (nombre de filtres actifs sur le bouton).
export function JournalTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readJournalSearch(searchParams)
  const requestKey = JSON.stringify(journalApiParams(search))
  const entries = useInspectorEntries(requestKey)
  const list = entries.data?.data
  const [emailInput, setEmailInput] = useState(search.email)
  const emailTimer = useRef(null)
  const [purging, setPurging] = useState(false)
  const [toast, setToast] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const openedId = search.openedEntryId
  const opened = useInspectorEntry(openedId)
  const openedEntry = opened.entry

  function update(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value)
      else next.delete(name)
    }
    setSearchParams(next)
  }

  // Filtres : retour à la première page
  function filter(changes) {
    update({ ...changes, page: null })
  }

  function changeEmail(value) {
    setEmailInput(value)
    clearTimeout(emailTimer.current)
    emailTimer.current = setTimeout(() => filter({ email: value.trim() }), SEARCH_DELAY_MS)
  }
  useEffect(() => () => clearTimeout(emailTimer.current), [])

  function clearFilters() {
    clearTimeout(emailTimer.current)
    setEmailInput('')
    update(Object.fromEntries(JOURNAL_FILTER_PARAMS.map((name) => [name, null])))
  }

  function choosePeriod(value) {
    const period = journalPeriods().find((item) => item.value === value)
    filter({ du: period.from, au: period.to })
  }

  const filtered = isJournalFiltered(search)
  const moreCount = moreJournalFilterCount(search)
  const period = activeJournalPeriod(search)

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        {/* Ligne 1 : email, méthode, code et Purger ; ligne 2 : résultat, période et dates. Sous 640 px, méthode, code,
            période et dates sont repliés derrière « Filtres » (deux blocs, display: contents au-delà). */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Filtrer par email du compte"
              placeholder="Email du compte"
              value={emailInput}
              onChange={(event) => changeEmail(event.target.value)}
              className="py-2 pl-9 text-sm"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-controls="journal-filtres journal-periode"
            className="sm:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" /> Filtres
            {moreCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-on-primary tabular-nums">{moreCount}</span>}
          </Button>
          <Button variant="secondary" onClick={() => setPurging(true)} className="ml-auto sm:order-last">
            <Trash2 className="size-4" aria-hidden="true" /> Purger
          </Button>
          <div id="journal-filtres" className={cx('w-full grid-cols-2 gap-3 sm:contents', moreOpen ? 'grid' : 'hidden')}>
            <Select aria-label="Méthode" value={search.method ?? ''} onChange={(event) => filter({ methode: event.target.value })} className="py-2 text-sm sm:w-48">
              <option value="">Toutes les méthodes</option>
              {METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
            <Select aria-label="Code HTTP" value={search.status ?? ''} onChange={(event) => filter({ code: event.target.value })} className="py-2 text-sm sm:w-40">
              <option value="">Tous les codes</option>
              {HTTP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterChips label="Résultat" chips={OUTCOME_FILTERS} value={search.outcome} onChange={(value) => filter({ resultat: value })} />
          <div id="journal-periode" className={cx('order-first w-full gap-3 sm:contents', moreOpen ? 'grid' : 'hidden')}>
            <SegmentedControl
              label="Période"
              options={journalPeriods().map(({ value, label }) => ({ value, label }))}
              value={period}
              onChange={choosePeriod}
              className="max-w-full overflow-x-auto"
            />
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <Input type="date" aria-label="Du" title="Du" value={search.from ?? ''} onChange={(event) => filter({ du: event.target.value })} className="py-2 text-sm sm:w-40" />
              <span className="hidden text-sm text-muted sm:inline">au</span>
              <Input
                type="date"
                aria-label="Au"
                title="Au"
                value={search.to ?? ''}
                min={search.from ?? undefined}
                onChange={(event) => filter({ au: event.target.value })}
                className="py-2 text-sm sm:w-40"
              />
            </div>
          </div>
        </div>

        {(search.userId || search.flow) && (
          <div className="flex flex-wrap items-center gap-2">
            {search.userId && (
              <Button variant="secondary" onClick={() => filter({ compte: null })} className="text-sm">
                Compte n° {search.userId} <X className="size-4" aria-label="Retirer ce filtre" />
              </Button>
            )}
            {search.flow && (
              <Button variant="secondary" onClick={() => filter({ flow: null })} className="text-sm">
                Flow {search.flow} <X className="size-4" aria-label="Retirer ce filtre" />
              </Button>
            )}
          </div>
        )}
      </div>

      {entries.error ? (
        <ErrorState error={entries.error} onRetry={entries.reload} />
      ) : !list ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={filtered ? 'Aucune entrée trouvée' : 'Journal vide'}
          actions={
            filtered && (
              <Button variant="secondary" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )
          }
        >
          {filtered ? 'Modifiez ou retirez des filtres.' : 'Les requêtes qui modifient des données apparaîtront ici.'}
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted" aria-live="polite">
              {entries.data.meta.total} {entries.data.meta.total > 1 ? 'entrées' : 'entrée'}
            </p>
            {filtered && (
              <button type="button" onClick={clearFilters} className="min-h-11 text-sm font-semibold text-link hover:underline">
                Effacer les filtres
              </button>
            )}
          </div>
          <ul
            aria-busy={entries.loading}
            className={cx(
              'divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-opacity',
              entries.loading && 'opacity-60',
            )}
          >
            {list.map((entry) => (
              <JournalRow
                key={entry.id}
                entry={entry}
                selected={String(entry.id) === openedId}
                onOpen={() => update({ entree: String(entry.id) })}
              />
            ))}
          </ul>
          <Pagination meta={entries.data.meta} onPageChange={(page) => update({ page: page > 1 ? String(page) : null })} />
        </>
      )}

      <Drawer open={Boolean(openedId)} onClose={() => update({ entree: null })} title={openedEntry ? `Entrée n° ${openedEntry.id}` : 'Entrée du journal'}>
        <div className="grid gap-6 p-5">
          {opened.error ? (
            <ErrorState error={opened.error} onRetry={opened.reload} />
          ) : openedEntry ? (
            <EntryDetails entry={openedEntry} />
          ) : (
            <Loader />
          )}
        </div>
      </Drawer>

      <PurgeJournalModal
        open={purging}
        onClose={() => setPurging(false)}
        onPurged={(deleted) => {
          setPurging(false)
          setToast((previous) => ({
            message: `${deleted} ${deleted > 1 ? 'entrées supprimées' : 'entrée supprimée'} du journal.`,
            key: (previous?.key ?? 0) + 1,
          }))
          entries.reload()
        }}
      />

      {toast && <Toast key={toast.key} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
