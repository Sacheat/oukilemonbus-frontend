import { ArrowLeft, Ban, CalendarCheck, CalendarClock, CalendarX2, ChevronDown, Repeat, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { getRecurrence } from '../../api/recurrences'
import { useAuth } from '../../auth/useAuth'
import { CancelRecurrenceModal } from '../../components/recurrences/CancelRecurrenceModal'
import { OccurrencesCalendar } from '../../components/recurrences/OccurrencesCalendar'
import { SeriesHero } from '../../components/recurrences/SeriesHero'
import { StatusMix } from '../../components/recurrences/StatusMix'
import { FactTiles } from '../../components/reservations/FactTiles'
import { ReservationEvent } from '../../components/reservations/ReservationEvent'
import { TripMap } from '../../components/reservations/TripMap'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DetailList } from '../../components/ui/DetailList'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Panel } from '../../components/ui/Panel'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { cancellableOccurrences } from '../../lib/recurrences'
import { isTerminal, shortAddress, todayApiDate } from '../../lib/reservations'

const PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
  { value: 'tous', label: 'Tous' },
]

const PAGE_SIZE = 10

const EMPTY_MESSAGES = {
  'a-venir': 'Plus aucun trajet à venir dans cette série.',
  passes: 'Aucun trajet passé pour le moment.',
  tous: 'Cette série ne contient aucun trajet.',
}

// Occurrences de la période choisie ; les passées de la plus récente à la plus ancienne
function filterOccurrences(reservations, period) {
  const today = todayApiDate()
  if (period === 'a-venir') return reservations.filter((reservation) => reservation.trip_date >= today)
  if (period === 'passes') return reservations.filter((reservation) => reservation.trip_date < today).reverse()
  return reservations
}

// Détail d'une série : bandeau façon billet (avec l'annulation de la série), chiffres clés, calendrier coloré
// par statut, informations et carte, puis les trajets en ligne du temps
export function RecurrenceDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('periode') ?? 'a-venir'
  const [dialog, setDialog] = useState(null) // 'cancel'
  // Trajets affichés dans la liste (« Afficher plus » en ajoute PAGE_SIZE)
  const [visible, setVisible] = useState(PAGE_SIZE)
  // Message transmis par une autre page (ex. après la création)
  const location = useLocation()
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const navigate = useNavigate()

  // Le message ne doit s'afficher qu'une fois : on le retire de l'historique (sinon il revient au rechargement)
  useEffect(() => {
    if (location.state?.notice) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  const fetchRecurrence = useCallback((signal) => getRecurrence(id, { signal }), [id])
  const { data: recurrence, error, loading, reload } = useApi(fetchRecurrence)

  function setPeriod(value) {
    const next = new URLSearchParams(searchParams)
    if (value === 'a-venir') next.delete('periode')
    else next.set('periode', value)
    setSearchParams(next, { replace: true })
    setVisible(PAGE_SIZE)
  }

  function handleCancelled({ cancelled_count: count }) {
    setDialog(null)
    setNotice(`${count > 1 ? `${count} trajets annulés` : count === 1 ? '1 trajet annulé' : 'Aucun trajet annulé'}. La série est arrêtée.`)
    reload()
  }

  const backLink = (
    <Link to="/espace/recurrences" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Récurrences
    </Link>
  )

  if (error) {
    const status = error.response?.status
    return (
      <>
        {backLink}
        {status === 404 || status === 403 ? (
          <Alert tone="danger" title="Série introuvable" className="mt-4">
            Cette série n’existe pas ou vous n’y avez pas accès.
          </Alert>
        ) : (
          <ErrorState error={error} onRetry={reload} className="mt-4" />
        )}
      </>
    )
  }

  if (!recurrence || (loading && recurrence.id !== Number(id))) {
    return (
      <div role="status" className="grid gap-5">
        <span className="sr-only">Chargement de la série…</span>
        {backLink}
        <Skeleton className="h-60 w-full rounded-panel" />
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    )
  }

  const reservations = recurrence.reservations ?? []
  const occurrences = filterOccurrences(reservations, period)
  const cancellable = cancellableOccurrences(reservations)
  const conflictCount = recurrence.status_counts?.en_conflit ?? 0
  const organization = recurrence.organization
  const canCancelSeries = can('recurrences.cancel') && cancellable.length > 0
  // Heures d'arrivée du bandeau : celles du prochain trajet (calculées par le backend pour chaque trajet)
  const nextTrip = reservations.find((reservation) => reservation.trip_date === recurrence.next_trip_date) ?? null
  const today = todayApiDate()
  const upcomingCount = reservations.filter((reservation) => reservation.trip_date >= today && !isTerminal(reservation)).length
  const passengers = recurrence.nb_adults != null ? Number(recurrence.nb_children ?? 0) + Number(recurrence.nb_adults) : null

  const facts = [
    { icon: Repeat, label: 'Trajets prévus', value: recurrence.reservations_count ?? reservations.length },
    { icon: CalendarCheck, label: 'À venir', value: upcomingCount },
    recurrence.next_trip_date && {
      icon: CalendarClock,
      label: 'Prochain trajet',
      value: formatDate(recurrence.next_trip_date, { weekday: 'short', day: 'numeric', month: 'short' }),
      detail: countdown(recurrence.next_trip_date),
    },
    passengers != null && {
      icon: Users,
      label: 'Passagers',
      value: passengers,
      detail: `${recurrence.nb_children} enfant${recurrence.nb_children > 1 ? 's' : ''}, ${recurrence.nb_adults} adulte${recurrence.nb_adults > 1 ? 's' : ''}`,
    },
  ].filter(Boolean)

  const periodSwitch = (
    <div role="group" aria-label="Période" className="flex rounded-control border border-line-strong bg-surface p-1">
      {PERIODS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={period === option.value}
          onClick={() => setPeriod(option.value)}
          className={cx(
            'min-h-9 rounded-md px-3 text-sm font-semibold',
            period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div className="grid gap-5">
        <div>{backLink}</div>

        <SeriesHero recurrence={recurrence} nextTrip={nextTrip}>
          {canCancelSeries && (
            <Button variant="danger" onClick={() => setDialog('cancel')}>
              <Ban className="size-4" aria-hidden="true" /> Annuler la série
            </Button>
          )}
        </SeriesHero>

        {notice && <Alert tone="success">{notice}</Alert>}
        {conflictCount > 0 && (
          <Alert tone="warning" title={conflictCount > 1 ? `${conflictCount} trajets en conflit` : '1 trajet en conflit'}>
            Un problème bloque ces trajets pour le moment. Ouvrez-les pour voir le détail ; la commune s’en occupe.
          </Alert>
        )}

        <FactTiles facts={facts} />

        <Panel title="Calendrier de la série">
          <div className="p-5">
            <OccurrencesCalendar recurrence={recurrence} reservations={reservations} />
          </div>
        </Panel>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Panel title="Informations">
            <div className="px-5 pb-5">
              <DetailList
                items={[
                  organization && [
                    'Organisation',
                    `${organization.name} (${organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]})`,
                  ],
                  recurrence.activity_type_label && ['Activité', recurrence.activity_type_label],
                  ['Prise en charge', shortAddress(recurrence.pickup_location)],
                  ['Destination', shortAddress(recurrence.destination_location)],
                ]}
              />
              <StatusMix counts={recurrence.status_counts} className="mt-4" />
            </div>
          </Panel>
          {recurrence.pickup_location && recurrence.destination_location && (
            <Panel title="Carte du trajet">
              <TripMap pickup={recurrence.pickup_location} destination={recurrence.destination_location} />
            </Panel>
          )}
        </div>

        <Panel title="Trajets de la série" action={periodSwitch}>
          <div className="p-5">
            <p className="mb-4 text-sm text-muted">Chaque trajet s’ouvre, se modifie ou s’annule séparément.</p>
            {occurrences.length === 0 ? (
              <EmptyState icon={CalendarX2} title="Aucun trajet">
                {EMPTY_MESSAGES[period] ?? EMPTY_MESSAGES.tous}
              </EmptyState>
            ) : (
              <>
                <ol className="relative ml-1.5 grid gap-3 border-l-2 border-line-strong pl-7">
                  {occurrences.slice(0, visible).map((reservation) => (
                    <ReservationEvent key={reservation.id} reservation={reservation} showSeries={false} />
                  ))}
                </ol>
                {occurrences.length > visible && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="secondary" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                      <ChevronDown className="size-4" aria-hidden="true" /> Afficher plus ({occurrences.length - visible})
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>
      </div>

      <CancelRecurrenceModal
        recurrence={recurrence}
        activeCount={cancellable.length}
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onCancelled={handleCancelled}
      />
    </>
  )
}
