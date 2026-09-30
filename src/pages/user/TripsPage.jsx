import { ChevronDown, Plus, Route } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getReservations } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { ReservationEvent } from '../../components/reservations/ReservationEvent'
import { StatusChips } from '../../components/reservations/StatusChips'
import { TripPreview } from '../../components/reservations/TripPreview'
import { TripsCalendar } from '../../components/reservations/TripsCalendar'
import { TripsSkeleton } from '../../components/reservations/TripsSkeleton'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Select } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { getErrorMessage } from '../../lib/errors'
import { todayApiDate, yesterdayApiDate } from '../../lib/reservations'
import { fetchStatusCounts, groupByMonth } from '../../lib/trips'

const PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
  { value: 'tous', label: 'Tous' },
]

// Paramètres de l'API selon la période et l'organisation (sans statut)
function periodParams(filters) {
  const period = filters.get('periode') ?? 'a-venir'
  const params = {}
  if (period === 'a-venir') Object.assign(params, { date_from: todayApiDate(), sort: 'asc' })
  if (period === 'passes') Object.assign(params, { date_to: yesterdayApiDate(), sort: 'desc' })
  if (filters.get('organisation')) params.organization_id = filters.get('organisation')
  return params
}

function listParams(filters, page) {
  const params = { ...periodParams(filters), page }
  if (filters.get('statut')) params.status = filters.get('statut')
  return params
}

// Mes déplacements (maquette 02 : fil de suivi), groupés par mois, avec mini-calendrier.
// Filtres dans l'URL (?periode=…&statut=…&organisation=…) ; ?apercu=id ouvre l'aperçu rapide.
// « Charger plus » ajoute les 15 trajets suivants à la suite de la ligne du temps.
export function TripsPage() {
  const { user, can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('periode') ?? 'a-venir'
  const previewId = searchParams.get('apercu')
  const [highlighted, setHighlighted] = useState(null)

  // Filtres de la liste, sans l'aperçu : ouvrir un aperçu ne recharge pas la liste
  const filters = new URLSearchParams(searchParams)
  filters.delete('apercu')
  filters.delete('page')
  const filterQuery = filters.toString()

  const fetchFirstPage = useCallback(
    (signal) => getReservations(listParams(new URLSearchParams(filterQuery), 1), { signal }),
    [filterQuery],
  )
  const baseQuery = new URLSearchParams(periodParams(new URLSearchParams(filterQuery))).toString()
  const fetchCounts = useCallback(
    (signal) => fetchStatusCounts(Object.fromEntries(new URLSearchParams(baseQuery)), { signal }),
    [baseQuery],
  )
  const trips = useApi(fetchFirstPage)
  const counts = useApi(fetchCounts)

  // Pages suivantes chargées par « Charger plus », rattachées aux filtres qui les ont produites
  const [more, setMore] = useState({ query: null, pages: [], loading: false, error: null })
  const extraPages = more.query === filterQuery ? more.pages : []
  const lastMeta = extraPages.at(-1)?.meta ?? trips.data?.meta
  const hasMore = Boolean(lastMeta && lastMeta.current_page < lastMeta.last_page)
  const loadingMore = more.query === filterQuery && more.loading

  async function loadMore() {
    const page = lastMeta.current_page + 1
    setMore({ query: filterQuery, pages: extraPages, loading: true, error: null })
    try {
      const next = await getReservations(listParams(new URLSearchParams(filterQuery), page))
      setMore({ query: filterQuery, pages: [...extraPages, next], loading: false, error: null })
    } catch (error) {
      setMore({ query: filterQuery, pages: extraPages, loading: false, error: getErrorMessage(error) })
    }
  }

  // Après une action dans l'aperçu (annulation…) : liste et compteurs rechargés depuis le début
  function refreshList() {
    setMore({ query: null, pages: [], loading: false, error: null })
    trips.reload()
    counts.reload()
  }

  // La mise en évidence d'un trajet (clic dans le calendrier) s'efface après 2 s
  useEffect(() => {
    if (!highlighted) return undefined
    const timer = setTimeout(() => setHighlighted(null), 2000)
    return () => clearTimeout(timer)
  }, [highlighted])

  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')
    setSearchParams(next)
  }

  function previewSearch(id) {
    const next = new URLSearchParams(searchParams)
    next.set('apercu', String(id))
    return `?${next.toString()}`
  }

  function closePreview() {
    const next = new URLSearchParams(searchParams)
    next.delete('apercu')
    setSearchParams(next)
  }

  // Jour du calendrier : défilement jusqu'au trajet s'il est dans la liste, sinon aperçu rapide
  function handleSelectDay(date, dayTrips) {
    const first = dayTrips[0]
    const element = document.getElementById(`trajet-${first.id}`)
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      setHighlighted(first.id)
    } else {
      setSearchParams(new URLSearchParams(previewSearch(first.id)))
    }
  }

  const organizations = user.organizations ?? []
  const canCreate = can('reservations.create') && organizations.length > 0
  const allTrips = trips.data ? [...trips.data.data, ...extraPages.flatMap((page) => page.data)] : []
  const groups = groupByMonth(allTrips)

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

        <section aria-label="Liste des déplacements" aria-busy={trips.loading || loadingMore} className="mt-6">
          {trips.error ? (
            <ErrorState error={trips.error} onRetry={trips.reload} />
          ) : !trips.data ? (
            <TripsSkeleton />
          ) : allTrips.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Aucun déplacement"
              actions={canCreate && <Button to="/espace/reservations/nouvelle">Créer une réservation</Button>}
            >
              {filterQuery ? 'Aucun déplacement ne correspond à ces filtres.' : 'Vos demandes de trajet apparaîtront ici.'}
            </EmptyState>
          ) : (
            <>
              <div className={cx('grid gap-6', trips.loading && 'opacity-60')}>
                {groups.map((group) => (
                  <section key={group.key} aria-labelledby={`mois-${group.key}`}>
                    <h2
                      id={`mois-${group.key}`}
                      className="sticky top-0 z-10 -mx-1 mb-3 bg-bg/90 px-1 py-2 text-sm font-extrabold tracking-[.1em] uppercase backdrop-blur-sm"
                    >
                      {group.label}
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
                            to={previewSearch(item.reservation.id)}
                            highlighted={highlighted === item.reservation.id}
                          />
                        ),
                      )}
                    </ol>
                  </section>
                ))}
              </div>

              {loadingMore && (
                <div className="mt-3">
                  <TripsSkeleton count={2} />
                </div>
              )}
              {more.query === filterQuery && more.error && <p className="mt-4 text-sm font-semibold text-danger">{more.error}</p>}
              <div className="mt-6 flex flex-col items-center gap-2">
                {hasMore ? (
                  <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                    <ChevronDown className="size-4" aria-hidden="true" /> Charger plus
                  </Button>
                ) : null}
                <p className="text-xs text-muted">
                  {allTrips.length} sur {trips.data.meta.total} déplacement{trips.data.meta.total > 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">
        <TripsCalendar organizationId={searchParams.get('organisation')} onSelectDay={handleSelectDay} />
      </aside>

      <Drawer open={Boolean(previewId)} onClose={closePreview} title="Aperçu du déplacement">
        {previewId && <TripPreview reservationId={previewId} onChanged={refreshList} />}
      </Drawer>
    </div>
  )
}
