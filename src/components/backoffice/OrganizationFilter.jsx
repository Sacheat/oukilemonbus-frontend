import axios from 'axios'
import { Building2, LoaderCircle, Search, X } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { getOrganization, getOrganizationsPage } from '../../api/organizations'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { getErrorMessage } from '../../lib/errors'

const DEBOUNCE_MS = 300
const MIN_LENGTH = 2

// Filtre « Organisation » de la file : recherche côté backend (GET /organizations?q=), 300 ms après la dernière
// frappe, à partir de 2 lettres, requête précédente annulée ; on ne charge jamais toutes les organisations.
// `value` : id choisi (texte de l'URL) ou '' ; `onChange(id | null)`. Au retour sur la page, le nom de l'organisation
// choisie est relu par GET /organizations/{id}.
export function OrganizationFilter({ value, onChange, className }) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [results, setResults] = useState({ query: null, items: [], hasMore: false, error: null })
  // Organisation choisie dans la liste (son nom est déjà connu, pas besoin de la relire)
  const [chosen, setChosen] = useState(null)

  const trimmed = query.trim()
  const searchable = trimmed.length >= MIN_LENGTH

  useEffect(() => {
    if (!searchable) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      getOrganizationsPage({ q: trimmed, sort: 'nom' }, { signal: controller.signal })
        .then((page) => setResults({ query: trimmed, items: page.data, hasMore: page.meta.last_page > 1, error: null }))
        .catch((error) => {
          if (axios.isCancel(error)) return
          setResults({ query: trimmed, items: [], hasMore: false, error })
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, searchable])

  const known = chosen && String(chosen.id) === value ? chosen : null
  const fetchSelected = useCallback(
    (signal) => (value && !known ? getOrganization(value, { signal }) : Promise.resolve(null)),
    [value, known],
  )
  const selected = useApi(fetchSelected)
  const selectedName = known?.name ?? selected.data?.name

  const loading = searchable && results.query !== trimmed
  const current = searchable && results.query === trimmed ? results : { items: [], hasMore: false, error: null }
  const showList = open && searchable

  function choose(organization) {
    setChosen({ id: organization.id, name: organization.name })
    onChange(String(organization.id))
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, current.items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && showList && current.items[activeIndex]) {
      event.preventDefault()
      choose(current.items[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  // Organisation choisie : son nom et un bouton pour retirer le filtre
  if (value) {
    return (
      <div className={cx('flex min-h-11 items-center gap-2 rounded-control border border-primary bg-soft pl-3 text-sm', className)}>
        <Building2 className="size-4 shrink-0 text-link" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-semibold">
          {selectedName ?? (selected.error ? `Organisation n° ${value}` : '…')}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Retirer le filtre : ${selectedName ?? `organisation n° ${value}`}`}
          className="grid size-10 shrink-0 place-items-center rounded-control text-muted hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  const activeId = showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined

  return (
    <div className={cx('relative', className)}>
      <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="text"
        role="combobox"
        aria-label="Filtrer par organisation"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        value={query}
        placeholder="Organisation…"
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className="block min-h-11 w-full rounded-control border border-line-strong bg-surface py-2 pr-9 pl-9 text-sm text-ink placeholder:text-muted"
      />
      {loading ? (
        <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden="true" />
      ) : (
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      )}
      {open && query && !searchable && (
        <p className="absolute z-20 mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-muted shadow-lg">
          Saisissez au moins {MIN_LENGTH} lettres.
        </p>
      )}
      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Organisations proposées"
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-20 mt-1 max-h-80 w-full min-w-64 overflow-y-auto rounded-control border border-line bg-surface py-1 text-sm shadow-lg"
        >
          {loading && current.items.length === 0 && <li className="px-3 py-2 text-muted">Recherche…</li>}
          {!loading && current.error && <li className="px-3 py-2 text-danger">{getErrorMessage(current.error)}</li>}
          {!loading && !current.error && current.items.length === 0 && (
            <li className="px-3 py-2 text-muted">Aucune organisation ne correspond.</li>
          )}
          {current.items.map((organization, index) => (
            <li
              key={organization.id}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => choose(organization)}
              className={cx('cursor-pointer px-3 py-2.5', index === activeIndex && 'bg-soft')}
            >
              <span className="block font-semibold">{organization.name}</span>
              {organization.type_label && <span className="block text-xs text-muted">{organization.type_label}</span>}
            </li>
          ))}
          {current.hasMore && <li className="px-3 py-2 text-xs text-muted">D’autres résultats : affinez la recherche.</li>}
        </ul>
      )}
    </div>
  )
}
