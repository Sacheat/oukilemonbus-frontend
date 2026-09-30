import axios from 'axios'
import { LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { createLocation, searchLocations, suggestLocations } from '../../api/locations'
import { cx } from '../../lib/cx'
import { getErrorMessage } from '../../lib/errors'
import { shortAddress } from '../../lib/reservations'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 300

// Choix d'un lieu : un seul champ qui propose les lieux déjà enregistrés puis les adresses
// suggérées. Une adresse suggérée est enregistrée (POST /locations) au moment du choix.
// `inputProps` : props d'accessibilité fournies par <Field> (id, aria-invalid, aria-describedby).
export function LocationPicker({ value, onChange, inputProps, placeholder = 'Rechercher une adresse…' }) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [results, setResults] = useState({ query: null, saved: [], suggestions: [], error: null })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const trimmed = query.trim()
  const searchable = trimmed.length >= MIN_QUERY_LENGTH

  // Recherche avec debounce ; les résultats sont liés à la requête qui les a produits
  useEffect(() => {
    if (!searchable) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      Promise.all([
        searchLocations(trimmed, { signal: controller.signal }),
        suggestLocations(trimmed, { signal: controller.signal }),
      ])
        .then(([saved, suggestions]) => {
          // Retire des suggestions les adresses déjà enregistrées
          const savedPlaceIds = new Set(saved.map((location) => location.place_id).filter(Boolean))
          setResults({
            query: trimmed,
            saved,
            suggestions: suggestions.filter((suggestion) => !savedPlaceIds.has(suggestion.place_id)),
            error: null,
          })
        })
        .catch((error) => {
          if (axios.isCancel(error)) return
          setResults({ query: trimmed, saved: [], suggestions: [], error })
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, searchable])

  const loading = searchable && results.query !== trimmed
  const current = searchable && results.query === trimmed ? results : { saved: [], suggestions: [], error: null }
  const options = [
    ...current.saved.map((location) => ({ kind: 'saved', location })),
    ...current.suggestions.map((suggestion) => ({ kind: 'suggestion', suggestion })),
  ]
  const showList = open && searchable

  async function select(option) {
    setSaveError(null)
    if (option.kind === 'saved') {
      onChange(option.location)
    } else {
      setSaving(true)
      try {
        onChange(await createLocation(option.suggestion))
      } catch (error) {
        setSaveError(getErrorMessage(error, 'Impossible d’enregistrer cette adresse.'))
        return
      } finally {
        setSaving(false)
      }
    }
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && showList && options[activeIndex]) {
      event.preventDefault()
      select(options[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  if (value) {
    return (
      <div className="flex min-h-11.5 items-center gap-3 rounded-lg border border-line-strong bg-surface-muted px-3 py-2">
        <MapPin className="size-4.5 shrink-0 text-link" aria-hidden="true" />
        <span className="min-w-0 flex-1 font-normal">
          <span className="block">{shortAddress(value)}</span>
          {value.postal_code && <span className="block text-xs text-muted">{value.postal_code}</span>}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Changer le lieu : ${shortAddress(value)}`}
          aria-describedby={inputProps['aria-describedby']}
          className="grid size-9 shrink-0 place-items-center rounded-control text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  const activeId = showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
  let optionIndex = -1

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-3.5 left-3 size-4.5 text-muted" aria-hidden="true" />
      <input
        {...inputProps}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        value={query}
        placeholder={placeholder}
        disabled={saving}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
          setSaveError(null)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className={cx(
          'block min-h-11.5 w-full rounded-lg border border-line-strong bg-surface py-2.5 pr-10 pl-10',
          'font-normal text-ink placeholder:text-muted aria-invalid:border-danger',
        )}
      />
      {(loading || saving) && (
        <LoaderCircle className="absolute top-3.5 right-3 size-4.5 animate-spin text-muted" aria-hidden="true" />
      )}
      {!searchable && open && query && (
        <p className="mt-1.5 text-xs font-normal text-muted">Saisissez au moins 3 caractères.</p>
      )}
      {saveError && <p className="mt-1.5 text-xs font-semibold text-danger">{saveError}</p>}

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Lieux proposés"
          // Empêche la perte de focus avant le clic sur une option
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 font-normal shadow-lg"
        >
          {loading && options.length === 0 && <li className="px-3 py-2 text-sm text-muted">Recherche…</li>}
          {!loading && current.error && (
            <li className="px-3 py-2 text-sm text-danger">{getErrorMessage(current.error)}</li>
          )}
          {!loading && !current.error && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">
              Aucun résultat. Essayez avec une adresse (rue et commune).
            </li>
          )}
          {[
            ['Lieux enregistrés', current.saved, 'saved'],
            ['Adresses', current.suggestions, 'suggestion'],
          ].map(([title, items, kind]) =>
            items.length === 0 ? null : (
              <li key={kind} role="presentation">
                <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-[.1em] text-muted uppercase">{title}</p>
                <ul role="group" aria-label={title}>
                  {items.map((item) => {
                    optionIndex += 1
                    const index = optionIndex
                    const option = kind === 'saved' ? { kind, location: item } : { kind, suggestion: item }
                    return (
                      <li
                        key={`${kind}-${item.id ?? item.place_id ?? item.label}`}
                        id={`${listboxId}-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        onClick={() => select(option)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cx(
                          'flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm',
                          index === activeIndex && 'bg-soft',
                        )}
                      >
                        <MapPin className="size-4 shrink-0 text-muted" aria-hidden="true" />
                        <span>
                          {shortAddress(item)}
                          {item.postal_code && <span className="text-muted"> · {item.postal_code}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
