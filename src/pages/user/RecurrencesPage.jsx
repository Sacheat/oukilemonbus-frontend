import { Plus, Repeat } from 'lucide-react'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { getRecurrences } from '../../api/recurrences'
import { useAuth } from '../../auth/useAuth'
import { RecurrenceCard } from '../../components/recurrences/RecurrenceCard'
import { RecurrencesSkeleton } from '../../components/recurrences/RecurrencesSkeleton'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { recurrenceOrganizations } from '../../lib/recurrences'

const STATES = [
  { value: 'actives', label: 'Actives' },
  { value: 'arretees', label: 'Arrêtées' },
  { value: 'toutes', label: 'Toutes' },
]

const EMPTY_MESSAGES = {
  actives: 'Aucune série active pour le moment.',
  arretees: 'Aucune série arrêtée.',
  toutes: 'Vos séries de trajets réguliers apparaîtront ici.',
}

// Paramètres de l'API selon les filtres de l'URL (?etat=…&page=…)
function toApiParams(searchParams) {
  const state = searchParams.get('etat') ?? 'actives'
  const params = { page: searchParams.get('page') ?? 1 }
  if (state === 'actives') params.is_active = 1
  if (state === 'arretees') params.is_active = 0
  return params
}

// Séries de réservations des écoles et du personnel communal
export function RecurrencesPage() {
  const { user, can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = searchParams.get('etat') ?? 'actives'
  const query = searchParams.toString()

  const fetchRecurrences = useCallback(
    (signal) => getRecurrences(toApiParams(new URLSearchParams(query)), { signal }),
    [query],
  )
  const recurrences = useApi(fetchRecurrences)

  // Modifie un filtre et revient à la première page
  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const canCreate = can('reservations.create') && recurrenceOrganizations(user).length > 0
  const createButton = canCreate && (
    <Button to="/espace/recurrences/nouvelle">
      <Plus className="size-4" aria-hidden="true" /> Nouvelle récurrence
    </Button>
  )

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Écoles et personnel communal"
        title="Récurrences"
        description="Vos trajets réguliers, réservés en une seule demande."
        actions={createButton}
        className="pb-5"
      />

      <div role="group" aria-label="État des séries" className="inline-flex rounded-control border border-line-strong bg-surface p-1">
        {STATES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={state === option.value}
            onClick={() => setFilter('etat', option.value === 'actives' ? null : option.value)}
            className={cx(
              'min-h-9 rounded-md px-3 text-sm font-semibold',
              state === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section aria-label="Liste des récurrences" aria-busy={recurrences.loading} className="mt-6">
        {recurrences.error ? (
          <ErrorState error={recurrences.error} onRetry={recurrences.reload} />
        ) : !recurrences.data ? (
          <RecurrencesSkeleton />
        ) : recurrences.data.data.length === 0 ? (
          <EmptyState icon={Repeat} title="Aucune récurrence" actions={createButton}>
            {EMPTY_MESSAGES[state] ?? EMPTY_MESSAGES.toutes}
          </EmptyState>
        ) : (
          <>
            <ul className={cx('grid gap-3.5', recurrences.loading && 'opacity-60')}>
              {recurrences.data.data.map((recurrence) => (
                <RecurrenceCard key={recurrence.id} recurrence={recurrence} />
              ))}
            </ul>
            <div className="mt-6">
              <Pagination meta={recurrences.data.meta} onPageChange={(page) => setFilter('page', String(page))} />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
