import { ScrollText, Search, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useInspectorEntry } from '../../hooks/useInspectorEntry'
import { useInspectorEntries } from '../../hooks/useInspectorEntries'
import { isJournalFiltered, journalApiParams, METHODS, OUTCOME_FILTERS, readJournalSearch } from '../../lib/tooling'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Field, Input, Select } from '../ui/Field'
import { FilterChips } from '../ui/FilterChips'
import { Loader } from '../ui/Loader'
import { Pagination } from '../ui/Pagination'
import { EntryDetails } from './EntryDetails'
import { JournalRow } from './JournalRow'
import { PurgeJournalModal } from './PurgeJournalModal'

const SEARCH_DELAY_MS = 300
const HTTP_STATUSES = ['200', '201', '202', '204', '401', '403', '404', '409', '419', '422', '429', '500']

// Onglet Journal : requêtes qui modifient des données, filtrées par le backend (?email=, ?compte=, ?resultat=,
// ?methode=, ?code=, ?du=, ?au=, ?flow=, ?page=), entrée ouverte dans un panneau (?entree=id, relue avec la fiche
// complète de son flow) et purge confirmée.
export function JournalTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = readJournalSearch(searchParams)
  const requestKey = JSON.stringify(journalApiParams(search))
  const entries = useInspectorEntries(requestKey)
  const list = entries.data?.data
  const [emailInput, setEmailInput] = useState(search.email)
  const emailTimer = useRef(null)
  const [purging, setPurging] = useState(false)
  const [notice, setNotice] = useState(null)

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

  const filtered = isJournalFiltered(search)

  return (
    <div className="grid gap-5">
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="grid gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full sm:w-72">
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
          <Select aria-label="Méthode" value={search.method ?? ''} onChange={(event) => filter({ methode: event.target.value })} className="max-w-36 py-2 text-sm">
            <option value="">Toutes les méthodes</option>
            {METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Select aria-label="Code HTTP" value={search.status ?? ''} onChange={(event) => filter({ code: event.target.value })} className="max-w-36 py-2 text-sm">
            <option value="">Tous les codes</option>
            {HTTP_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Field label="Du" className="text-xs">
            {(props) => <Input {...props} type="date" value={search.from ?? ''} onChange={(event) => filter({ du: event.target.value })} className="py-2 text-sm" />}
          </Field>
          <Field label="Au" className="text-xs">
            {(props) => <Input {...props} type="date" value={search.to ?? ''} min={search.from ?? undefined} onChange={(event) => filter({ au: event.target.value })} className="py-2 text-sm" />}
          </Field>
          <Button variant="secondary" onClick={() => setPurging(true)} className="ml-auto">
            <Trash2 className="size-4" aria-hidden="true" /> Purger
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips label="Résultat" chips={OUTCOME_FILTERS} value={search.outcome} onChange={(value) => filter({ resultat: value })} />
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
      </div>

      {entries.error ? (
        <ErrorState error={entries.error} onRetry={entries.reload} />
      ) : !list ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState icon={ScrollText} title={filtered ? 'Aucune entrée trouvée' : 'Journal vide'}>
          {filtered ? 'Modifiez ou retirez des filtres.' : 'Les requêtes qui modifient des données apparaîtront ici.'}
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {entries.data.meta.total} {entries.data.meta.total > 1 ? 'entrées' : 'entrée'}
          </p>
          <ul aria-busy={entries.loading} className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            {list.map((entry) => (
              <JournalRow key={entry.id} entry={entry} onOpen={() => update({ entree: String(entry.id) })} />
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
          setNotice(`${deleted} ${deleted > 1 ? 'entrées supprimées' : 'entrée supprimée'} du journal.`)
          entries.reload()
        }}
      />
    </div>
  )
}
