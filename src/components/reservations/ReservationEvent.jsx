import { ArrowRight, Repeat } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatDate, formatTime } from '../../lib/dates'
import { countdown } from '../../lib/home'
import { estimatedArrivals, isTerminal, shortAddress, statusHint, todayApiDate, totalPassengers } from '../../lib/reservations'
import { trackSpotlight } from '../../lib/spotlight'
import { STATUS_DOTS } from '../../lib/trips'
import { StatusBadge } from '../ui/StatusBadge'

// Étape du fil de suivi : point coloré selon le statut sur la ligne du temps, puis une carte
// entièrement cliquable avec une pastille de date façon billet. Annulés et refusés sont estompés.
// `to` : cible du clic (aperçu rapide dans la liste, détail par défaut) ; badge « Série » si le trajet
// fait partie d'une récurrence (`showSeries={false}` dans le détail d'une série). `highlighted` : mise en évidence
// brève (clic dans le mini-calendrier).
export function ReservationEvent({ reservation, to = `/espace/deplacements/${reservation.id}`, highlighted = false, showSeries = true }) {
  const destination = shortAddress(reservation.destination_location)
  const terminal = isTerminal(reservation)
  const today = todayApiDate()
  const soon = !terminal && reservation.trip_date >= today ? countdown(reservation.trip_date) : null
  const showSoon = soon === 'aujourd’hui' || soon === 'demain'
  const day = formatDate(reservation.trip_date, { weekday: 'short' }).replace('.', '')
  const arrivals = estimatedArrivals(reservation)

  return (
    <li id={`trajet-${reservation.id}`} className="relative scroll-mt-24">
      <span
        aria-hidden="true"
        className={cx(
          'absolute top-7 -left-[34px] size-3 rounded-full ring-4 ring-bg',
          STATUS_DOTS[reservation.status] ?? 'bg-neutral',
        )}
      />
      <Link
        to={to}
        onPointerMove={trackSpotlight}
        className={cx(
          'spotlight card-hover group flex overflow-hidden rounded-card border bg-surface shadow-soft',
          highlighted ? 'border-primary ring-2 ring-primary/40' : 'border-line',
          terminal && 'opacity-65 hover:opacity-100',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'grid w-16 shrink-0 place-content-center text-center leading-none',
            terminal ? 'bg-neutral-soft text-neutral' : 'bg-accent text-on-accent',
          )}
        >
          <span className="text-[11px] font-bold uppercase">{day}</span>
          <span className="mt-1 text-2xl font-extrabold">{Number(reservation.trip_date.slice(8, 10))}</span>
        </span>

        <span className="min-w-0 flex-1 px-4.5 py-3.5">
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={reservation.status} label={reservation.status_label} />
            {showSeries && reservation.recurrence_id && (
              <span className="inline-flex items-center gap-1 rounded-md bg-soft px-2 py-0.5 text-xs font-bold text-link">
                <Repeat className="size-3" aria-hidden="true" /> Série
              </span>
            )}
            {showSoon && (
              <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-extrabold text-on-accent uppercase">{soon}</span>
            )}
          </span>
          <span className={cx('mt-1 block truncate text-base font-bold', reservation.status === 'annule' && 'line-through decoration-1')}>
            {reservation.trip_purpose}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {formatDate(reservation.trip_date, { day: 'numeric', month: 'long' })} · {formatTime(reservation.departure_time)} →{' '}
            {formatTime(reservation.return_time)} · {totalPassengers(reservation)} pers.
            {destination && ` · ${destination}`}
          </span>
          <span className="mt-1 block text-xs text-muted">
            {[
              arrivals?.outbound && `Arrivée vers ${arrivals.outbound}`,
              arrivals?.back && `retour vers ${arrivals.back}`,
              reservation.organization?.name,
              statusHint(reservation),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>

        <span className="hidden items-center pr-4.5 text-link sm:flex">
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          <span className="sr-only">Ouvrir l’aperçu du déplacement</span>
        </span>
      </Link>
    </li>
  )
}
