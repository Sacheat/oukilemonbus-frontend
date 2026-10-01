import axios from 'axios'
import { LoaderCircle, Search, UserRound, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { cx } from '../../lib/cx'
import { ACCOUNT_SEARCH_MIN_LENGTH, searchEligibleAccounts } from '../../lib/drivers'
import { getErrorMessage } from '../../lib/errors'

const DEBOUNCE_MS = 300

// Choix d'un compte par recherche côté backend (nom, prénom ou email), sur le modèle de LocationPicker.
// La recherche part 300 ms après la dernière frappe, à partir de 2 lettres ; la requête précédente est annulée.
// `driverList` : chauffeurs existants, pour écarter les comptes qui ont déjà un profil.
// `value` : compte choisi ou null ; `inputProps` : props d'accessibilité fournies par <Field>.
export function AccountPicker({ driverList, value, onChange, inputProps }) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  // Résultats rattachés à la recherche qui les a produits (évite d'afficher une réponse périmée)
  const [results, setResults] = useState({ query: null, accounts: [], hasMore: false, error: null })

  const trimmed = query.trim()
  const searchable = trimmed.length >= ACCOUNT_SEARCH_MIN_LENGTH

  useEffect(() => {
    if (!searchable) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchEligibleAccounts(trimmed, driverList, { signal: controller.signal })
        .then(({ accounts, hasMore }) => setResults({ query: trimmed, accounts, hasMore, error: null }))
        .catch((error) => {
          if (axios.isCancel(error)) return
          setResults({ query: trimmed, accounts: [], hasMore: false, error })
        })
    }, DEBOUNCE_MS)
    // Nouvelle frappe : on annule le délai en cours et la requête déjà partie
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, searchable, driverList])

  const loading = searchable && results.query !== trimmed
  const current = searchable && results.query === trimmed ? results : { accounts: [], hasMore: false, error: null }
  const accounts = current.accounts
  const showList = open && searchable

  function select(account) {
    onChange(account)
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, accounts.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && showList && accounts[activeIndex]) {
      event.preventDefault()
      select(accounts[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  // Compte choisi : affiché avec un bouton pour en choisir un autre
  if (value) {
    return (
      <div className="flex min-h-11.5 items-center gap-3 rounded-lg border border-line-strong bg-surface-muted px-3 py-2">
        <UserRound className="size-4.5 shrink-0 text-link" aria-hidden="true" />
        <span className="min-w-0 flex-1 font-normal">
          <span className="block">{value.full_name}</span>
          <span className="block text-xs break-words text-muted">{value.email}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Changer de compte : ${value.full_name}`}
          aria-describedby={inputProps['aria-describedby']}
          className="grid size-11 shrink-0 place-items-center rounded-control text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  const activeId = showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined

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
        placeholder="Tapez un nom ou un email…"
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className={cx(
          'block min-h-11.5 w-full rounded-lg border border-line-strong bg-surface py-2.5 pr-10 pl-10',
          'font-normal text-ink placeholder:text-muted aria-invalid:border-danger',
        )}
      />
      {loading && <LoaderCircle className="absolute top-3.5 right-3 size-4.5 animate-spin text-muted" aria-hidden="true" />}
      {!searchable && open && query && (
        <p className="mt-1.5 text-xs font-normal text-muted">Saisissez au moins {ACCOUNT_SEARCH_MIN_LENGTH} caractères.</p>
      )}

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Comptes proposés"
          // Empêche la perte de focus avant le clic sur une option
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 font-normal shadow-lg"
        >
          {loading && accounts.length === 0 && <li className="px-3 py-2 text-sm text-muted">Recherche…</li>}
          {!loading && current.error && <li className="px-3 py-2 text-sm text-danger">{getErrorMessage(current.error)}</li>}
          {!loading && !current.error && accounts.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">Aucun compte disponible ne correspond.</li>
          )}
          {accounts.map((account, index) => (
            <li
              key={account.id}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => select(account)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cx('flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm', index === activeIndex && 'bg-soft')}
            >
              <UserRound className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="min-w-0">
                {account.full_name}
                <span className="block text-xs break-words text-muted">{account.email}</span>
              </span>
            </li>
          ))}
          {!loading && current.hasMore && (
            <li role="presentation" className="px-3 py-2 text-xs text-muted">
              D'autres comptes correspondent : affinez la recherche.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
