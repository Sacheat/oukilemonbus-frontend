import axios from 'axios'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUsers } from '../../api/users'
import { getErrorMessage } from '../../lib/errors'
import { Input } from '../ui/Field'

const SEARCH_DELAY_MS = 300
const MIN_QUERY_LENGTH = 2

// Recherche d'un compte (GET /users?search=) : 300 ms après la dernière frappe, à partir de 2 lettres, requête
// précédente annulée, résultats rattachés au texte qui les a produits. `onSelect(user)` au choix d'un compte.
export function AccountSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ query: null, users: [], error: null })
  const trimmed = query.trim()
  const searchable = trimmed.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!searchable) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      getUsers({ search: trimmed }, { signal: controller.signal })
        .then((page) => setResults({ query: trimmed, users: page.data, error: null }))
        .catch((error) => {
          if (!axios.isCancel(error)) setResults({ query: trimmed, users: [], error: getErrorMessage(error) })
        })
    }, SEARCH_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, searchable])

  const current = searchable && results.query === trimmed ? results : null

  return (
    <div className="grid gap-2">
      <div className="relative w-full sm:w-96">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Rechercher un compte"
          placeholder="Prénom, nom ou email (2 lettres au moins)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="py-2 pl-9 text-sm"
        />
      </div>
      {searchable && !current && <p className="text-sm text-muted">Recherche…</p>}
      {current?.error && <p className="text-sm text-danger">{current.error}</p>}
      {current && !current.error && current.users.length === 0 && <p className="text-sm text-muted">Aucun compte trouvé.</p>}
      {current && current.users.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface sm:w-96">
          {current.users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(user)
                  setQuery('')
                }}
                className="flex min-h-11 w-full flex-col px-4 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span className="font-semibold">{user.full_name}</span>
                <span className="text-muted">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
