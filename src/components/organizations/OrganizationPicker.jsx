import { Search } from 'lucide-react'
import { useId, useState } from 'react'
import { cx } from '../../lib/cx'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { Input } from '../ui/Field'
import { OrganizationAvatar } from './OrganizationAvatar'

// Sans accents ni majuscules, pour une recherche tolérante (« ecole » trouve « École »)
function normalize(text = '') {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Choix de l'organisation à rejoindre : recherche par nom ou type, puis cartes sélectionnables
// (boutons radio stylés). `organizations` : GET /organizations/available ; `onChange(id)` en chaîne.
export function OrganizationPicker({ organizations, value, onChange, error }) {
  const id = useId()
  const [query, setQuery] = useState('')
  const typeOf = (organization) => organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type] ?? ''
  const matches = organizations.filter((organization) =>
    normalize(`${organization.name} ${typeOf(organization)}`).includes(normalize(query.trim())),
  )

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-sm font-bold">
        Organisation <span aria-hidden="true">*</span>
      </legend>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher par nom ou type…"
          aria-label="Rechercher une organisation"
          className="pl-9"
        />
      </div>

      {matches.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Aucune organisation ne correspond à « {query} ».</p>
      ) : (
        <div className="mt-3 grid max-h-96 gap-2 overflow-y-auto p-0.5 sm:grid-cols-2">
          {matches.map((organization) => (
            <label
              key={organization.id}
              className={cx(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-card border border-line bg-surface p-3',
                'hover:border-primary has-checked:border-primary has-checked:bg-soft has-checked:ring-1 has-checked:ring-primary',
                'has-focus-visible:ring-2 has-focus-visible:ring-primary',
              )}
            >
              <input
                type="radio"
                name={id}
                value={organization.id}
                checked={String(value) === String(organization.id)}
                onChange={() => onChange(String(organization.id))}
                className="sr-only"
              />
              <OrganizationAvatar name={organization.name} className="size-10 text-sm" />
              <span className="min-w-0">
                <span className="block font-semibold break-words">{organization.name}</span>
                <span className="block text-sm text-muted">{typeOf(organization)}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
