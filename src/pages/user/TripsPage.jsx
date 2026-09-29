import { Plus, Route } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getReservations } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { ReservationEvent } from '../../components/reservations/ReservationEvent'
import { StatusChips } from '../../components/reservations/StatusChips'
import { TripsCalendar } from '../../components/reservations/TripsCalendar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Select } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { todayApiDate, yesterdayApiDate } from '../../lib/reservations'
import { fetchStatusCounts, groupByMonth } from '../../lib/trips'

const PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
  { value: 'tous', label: 'Tous' },
]

// Paramètres de l'API selon la période et l'organisation de l'URL (sans statut ni page)
function periodParams(searchParams) {
  const period = searchParams.get('periode') ?? 'a-venir'
  const params = {}
  if (period === 'a-venir') Object.assign(params, { date_from: todayApiDate(), sort: 'asc' })
  if (period === 'passes') Object.assign(params, { date_to: yesterdayApiDate(), sort: 'desc' })
  if (searchParams.get('organisation')) params.organization_id = searchParams.get('organisation')
  return params
}

// Paramètres complets de la liste (?periode=…&statut=…&organisation=…&page=…)
function toApiParams(searchParams) {
  const params = { ...periodParams(searchParams), page: searchParams.get('page') ?? 1 }
  if (searchParams.get('statut')) params.status = searchParams.get('statut')
  return params
}

// Mes déplacements (maquette 02 : fil de suivi), groupés par mois, avec mini-calendrier
export function TripsPage() {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('periode') ?? 'a-venir'
  const query = searchParams.toString()
  const [highlighted, setHighlighted] = useState(null)

  const fetchTrips = useCallback(
    (signal) => getReservations(toApiParams(new URLSearchParams(query)), { signal }),
    [query],
  )
  const baseQuery = new URLSearchParams(periodParams(new URLSearchParams(query))).toString()
  const fetchCounts = useCallback(
    (signal) => fetchStatusCounts(Object.fromEntries(new URLSearchParams(baseQuery)), { signal }),
    [baseQuery],
  )
  const trips = useApi(fetchTrips)
  const counts = useApi(fetchCounts)

  // La mise en évidence d'un trajet (clic dans le calendrier) s'efface après 2 s
  useEffect(() => {
    if (!highlighted) return undefined
    const timer = setTimeout(() => setHighlighted(null), 2000)
    return () => clearTimeout(timer)
  }, [highlighted])

  // Modifie un filtre et revient à la première page
  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setSearchParams(next)
  }

  // Jour du calendrier : défilement jusqu'au trajet s'il est dans la liste, sinon ouverture du détail
  function handleSelectDay(date, dayTrips) {
    const first = dayTrips[0]
    const element = document.getElementById(`trajet-${first.id}`)
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      setHighlighted(first.id)
    } else {
      navigate(`/espace/deplacements/${first.id}`)
    }
  }

  const organizations = user.organizations ?? []
  const canCreate = can('reservations.create') && organizations.length > 0
  const groups = trips.data ? groupByMonth(trips.data.data) : []

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
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

        <div className="grid gap-3">
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

          <StatusChips
            value={searchParams.get('statut')}
            counts={counts.data ?? null}
            onChange={(value) => setFilter('statut', value)}
          />
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
              <div className={cx('grid gap-6', trips.loading && 'opacity-60')}>
                {groups.map((group) => (
                  <section key={group.key} aria-labelledby={`mois-${group.key}`}>
                    <h2
                      id={`mois-${group.key}`}
                      className="sticky top-0 z-10 -mx-1 mb-3 flex items-baseline gap-2 bg-bg/90 px-1 py-2 backdrop-blur-sm"
                    >
                      <span className="text-sm font-extrabold tracking-[.1em] uppercase">{group.label}</span>
                    </h2>
                    <ol className="relative grid gap-3 border-l-2 border-line-strong pl-7">
                      {group.items.map((item) =>
                        item.type === 'today' ? (
                          <li key="today" className="relative flex items-center gap-3 py-1" aria-label="Aujourd’hui">
                            <span aria-hidden="true" className="absolute -left-[37px] size-4 rounded-full border-4 border-bg bg-accent ring-2 ring-accent" />
                            <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-on-accent uppercase">
                              Aujourd’hui
                            </span>
                            <span aria-hidden="true" className="h-0.5 flex-1 bg-accent/60" />
                          </li>
                        ) : (
                          <ReservationEvent
                            key={item.key}
                            reservation={item.reservation}
                            highlighted={highlighted === item.reservation.id}
                          />
                        ),
                      )}
                    </ol>
                  </section>
                ))}
              </div>
              <div className="mt-6">
                <Pagination meta={trips.data.meta} onPageChange={(page) => setFilter('page', String(page))} />
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">
        <TripsCalendar organizationId={searchParams.get('organisation')} onSelectDay={handleSelectDay} />
      </aside>
    </div>
  )
}
