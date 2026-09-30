import { ArrowLeft, Ban, CalendarX2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { getRecurrence } from '../../api/recurrences'
import { useAuth } from '../../auth/useAuth'
import { CancelRecurrenceModal } from '../../components/recurrences/CancelRecurrenceModal'
import { OccurrenceRow } from '../../components/recurrences/OccurrenceRow'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DetailList } from '../../components/ui/DetailList'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { formatDate, formatTime } from '../../lib/dates'
import { ORGANIZATION_TYPE_LABELS, RESERVATION_STATUS_LABELS } from '../../lib/labels'
import { cancellableOccurrences, describeFrequency, recurrenceState } from '../../lib/recurrences'
import { shortAddress, todayApiDate } from '../../lib/reservations'

const PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
  { value: 'tous', label: 'Tous' },
]

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

// Détail d'une série : résumé, occurrences et annulation de la série
export function RecurrenceDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('periode') ?? 'a-venir'
  const [dialog, setDialog] = useState(null) // 'cancel'
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

  if (!recurrence || (loading && recurrence.id !== Number(id))) return <Loader />

  const state = recurrenceState(recurrence)
  const frequency = describeFrequency(recurrence)
  const reservations = recurrence.reservations ?? []
  const occurrences = filterOccurrences(reservations, period)
  const cancellable = cancellableOccurrences(reservations)
  const statusCounts = Object.entries(recurrence.status_counts ?? {}).filter(([, count]) => count > 0)
  const conflictCount = recurrence.status_counts?.en_conflit ?? 0
  const organization = recurrence.organization
  const times = recurrence.departure_time && `${formatTime(recurrence.departure_time)} → ${formatTime(recurrence.return_time)}`
  const canCancelSeries = can('recurrences.cancel') && cancellable.length > 0

  return (
    <>
      {backLink}

      <header className="mt-2 pb-6">
        <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">Récurrence</p>
        <h1 className="mt-1 text-[27px] leading-tight font-bold tracking-tight">{recurrence.trip_purpose ?? frequency}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone={state.tone}>{state.label}</Badge>
          <span>{[frequency, times].filter(Boolean).join(' · ')}</span>
        </div>
      </header>

      <div className="grid gap-4">
        {notice && <Alert tone="success">{notice}</Alert>}

        {conflictCount > 0 && (
          <Alert tone="warning" title={conflictCount > 1 ? `${conflictCount} trajets en conflit` : '1 trajet en conflit'}>
            Un problème bloque ces trajets pour le moment. Ouvrez-les pour voir le détail ; la commune s’en occupe.
          </Alert>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Card as="section" aria-labelledby="trip-title">
            <h2 id="trip-title" className="text-[17px] font-bold">
              Trajet
            </h2>
            <DetailList
              items={[
                ['Prise en charge', shortAddress(recurrence.pickup_location)],
                ['Destination', shortAddress(recurrence.destination_location)],
                ['Départ', formatTime(recurrence.departure_time)],
                ['Départ du retour', formatTime(recurrence.return_time)],
              ]}
            />
          </Card>

          <Card as="section" aria-labelledby="calendar-title">
            <h2 id="calendar-title" className="text-[17px] font-bold">
              Calendrier
            </h2>
            <DetailList
              items={[
                ['Fréquence', frequency],
                ['Début', formatDate(recurrence.start_date)],
                ['Fin', formatDate(recurrence.end_date)],
                ['Trajets', recurrence.reservations_count ?? reservations.length],
                recurrence.next_trip_date && ['Prochain trajet', formatDate(recurrence.next_trip_date)],
              ]}
            />
          </Card>

          <Card as="section" aria-labelledby="passengers-title">
            <h2 id="passengers-title" className="text-[17px] font-bold">
              Passagers et suivi
            </h2>
            <DetailList
              items={[
                recurrence.nb_children != null && ['Enfants', recurrence.nb_children],
                recurrence.nb_adults != null && ['Adultes', recurrence.nb_adults],
                recurrence.activity_type_label && ['Activité', recurrence.activity_type_label],
                organization && [
                  'Organisation',
                  `${organization.name} (${organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]})`,
                ],
              ]}
            />
            {statusCounts.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Trajets par statut">
                {statusCounts.map(([status, count]) => (
                  <li key={status}>
                    <StatusBadge status={status} label={`${RESERVATION_STATUS_LABELS[status] ?? status} : ${count}`} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <section aria-labelledby="occurrences-title" className="rounded-card border border-line bg-surface pt-5.5 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5.5">
            <h2 id="occurrences-title" className="text-[17px] font-bold">
              Trajets de la série
            </h2>
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
          </div>
          {occurrences.length === 0 ? (
            <EmptyState icon={CalendarX2} title="Aucun trajet" className="mx-5.5 mt-4 mb-3.5">
              {EMPTY_MESSAGES[period] ?? EMPTY_MESSAGES.tous}
            </EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {occurrences.map((reservation) => (
                <OccurrenceRow key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          )}
        </section>

        {canCancelSeries && (
          <Card as="section" aria-labelledby="actions-title" className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="actions-title" className="text-[17px] font-bold">
                Actions
              </h2>
              <p className="mt-1 text-sm text-muted">
                Pour un seul trajet, ouvrez-le dans la liste ci-dessus : il peut être modifié ou annulé séparément.
              </p>
            </div>
            <Button variant="danger" onClick={() => setDialog('cancel')}>
              <Ban className="size-4" aria-hidden="true" /> Annuler la série
            </Button>
          </Card>
        )}
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
