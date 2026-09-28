import { Plus, Route } from 'lucide-react'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { getNextTrip, getReservations } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { NextTripCard } from '../../components/reservations/NextTripCard'
import { ReservationEvent } from '../../components/reservations/ReservationEvent'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Select } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { RESERVATION_STATUS_LABELS } from '../../lib/labels'
import { todayApiDate, yesterdayApiDate } from '../../lib/reservations'

const PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
  { value: 'tous', label: 'Tous' },
]

// Paramètres de l'API selon les filtres de l'URL (?periode=…&statut=…&organisation=…&page=…)
function toApiParams(searchParams) {
  const period = searchParams.get('periode') ?? 'a-venir'
  const params = { page: searchParams.get('page') ?? 1 }
  if (period === 'a-venir') Object.assign(params, { date_from: todayApiDate(), sort: 'asc' })
  if (period === 'passes') Object.assign(params, { date_to: yesterdayApiDate(), sort: 'desc' })
  if (searchParams.get('statut')) params.status = searchParams.get('statut')
  if (searchParams.get('organisation')) params.organization_id = searchParams.get('organisation')
  return params
}

// Mes déplacements (maquette 02 : fil de suivi)
export function TripsPage() {
  const { user, can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('periode') ?? 'a-venir'
  const query = searchParams.toString()

  const fetchTrips = useCallback(
    (signal) => getReservations(toApiParams(new URLSearchParams(query)), { signal }),
    [query],
  )
  const trips = useApi(fetchTrips)
  const nextTrip = useApi(fetchNextTrip)

  // Modifie un filtre et revient à la première page
  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const organizations = user.organizations ?? []
  const canCreate = can('reservations.create') && organizations.length > 0

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_265px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Suivi de vos demandes"
          title="Mes déplacements"
          description="Les étapes importantes de vos demandes de trajet."
          actions={
            canCreate && (
              <Button to="/espace/reservations/nouvelle">
                <Plus className="size-4" aria-hidden="true" /> Nouvelle réservation
              </Button>
            )
          }
          className="pb-5"
        />

        <div className="flex flex-wrap items-end gap-3">
          <div role="group" aria-label="Période" className="flex rounded-control border border-line-strong bg-surface p-1">
            {PERIODS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={period === option.value}
                onClick={() => setFilter('periode', option.value === 'a-venir' ? null : option.value)}
                className={cx(
                  'min-h-9 rounded-md px-3 text-sm font-semibold',
                  period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="text-xs font-bold text-muted">
            Statut
            <Select
              value={searchParams.get('statut') ?? ''}
              onChange={(event) => setFilter('statut', event.target.value)}
              className="mt-1 min-h-11 py-2 text-sm"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>

          {organizations.length > 1 && (
            <label className="text-xs font-bold text-muted">
              Organisation
              <Select
                value={searchParams.get('organisation') ?? ''}
                onChange={(event) => setFilter('organisation', event.target.value)}
                className="mt-1 min-h-11 py-2 text-sm"
              >
                <option value="">Toutes</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>

        <section aria-label="Liste des déplacements" aria-busy={trips.loading} className="mt-6">
          {trips.error ? (
            <ErrorState error={trips.error} onRetry={trips.reload} />
          ) : !trips.data ? (
            <Loader />
          ) : trips.data.data.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Aucun déplacement"
              actions={canCreate && <Button to="/espace/reservations/nouvelle">Créer une réservation</Button>}
            >
              {query ? 'Aucun déplacement ne correspond à ces filtres.' : 'Vos demandes de trajet apparaîtront ici.'}
            </EmptyState>
          ) : (
            <>
              <ol className={cx('grid gap-3.5 border-l-2 border-line-strong pl-7', trips.loading && 'opacity-60')}>
                {trips.data.data.map((reservation) => (
                  <ReservationEvent key={reservation.id} reservation={reservation} />
                ))}
              </ol>
              <div className="mt-6">
                <Pagination meta={trips.data.meta} onPageChange={(page) => setFilter('page', String(page))} />
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-4">
        {nextTrip.data && <NextTripCard reservation={nextTrip.data} compact />}
      </aside>
    </div>
  )
}

function fetchNextTrip(signal) {
  return getNextTrip({ signal })
}
