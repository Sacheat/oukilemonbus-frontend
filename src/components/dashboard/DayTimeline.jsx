import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { formatTime } from '../../lib/dates'
import { dayTimeline, planningDayLink } from '../../lib/dashboard'
import { RESERVATION_STATUS_LABELS } from '../../lib/labels'

// Couleur d'un trajet selon son statut (mêmes tons que StatusBadge) : fond doux, bord de la couleur du statut
const STATUS_BARS = {
  en_attente: 'bg-warning-soft border-warning',
  approuve: 'bg-info-soft border-info',
  confirme: 'bg-success-soft border-success',
  en_conflit: 'bg-conflict-soft border-conflict',
}
const STATUS_DOTS = { en_attente: 'bg-warning', approuve: 'bg-info', confirme: 'bg-success', en_conflit: 'bg-conflict' }

// Frise de la journée : une ligne par bus, trajets en barres (départ → retour) qui affichent l'heure de départ
// (le nom complet au survol et pour les lecteurs d'écran), trait « maintenant ». Trajets terminés estompés,
// trajet en route souligné (`progress` : avancement réel, sinon l'horaire). Une barre ouvre le trajet dans le
// Planning si `linkable`.
// Sur petit écran, la frise défile horizontalement dans son cadre (la page, elle, ne défile pas).
export function DayTimeline({ trips, nowTime, linkable, progress }) {
  const timeline = dayTimeline(trips, nowTime, progress)
  const statuses = [...new Set(trips.map((trip) => trip.status))].filter((status) => STATUS_BARS[status])
  const scroller = useRef(null)
  // Repère où amener la frise quand elle défile (petit écran) : maintenant, sinon le premier trajet
  // Gardé tel qu'à l'ouverture : un rafraîchissement ne reprend pas la main à l'utilisateur
  const [focusLeft] = useState(
    () => timeline.now ?? Math.min(...timeline.rows.flatMap((row) => row.lanes.flat().map((bar) => bar.left))),
  )

  useEffect(() => {
    const element = scroller.current
    if (!element || element.scrollWidth <= element.clientWidth) return
    element.scrollLeft = (focusLeft / 100) * element.scrollWidth - element.clientWidth / 3
  }, [focusLeft])

  return (
    <figure className="grid gap-3 px-5 pt-4 pb-4">
      <div ref={scroller} className="overflow-x-auto">
        <div className="relative min-w-[36rem] pr-1 pb-1">
          <div className="relative ml-30 h-5 text-[11px] text-muted tabular-nums" aria-hidden="true">
            {timeline.hours.map((hour) => (
              <span
                key={hour.label}
                // Heures des bords alignées vers l'intérieur pour ne pas déborder du cadre
                className={cx('absolute', hour.left <= 0 ? '' : hour.left >= 100 ? '-translate-x-full' : '-translate-x-1/2')}
                style={{ left: `${hour.left}%` }}
              >
                {hour.label}
              </span>
            ))}
          </div>

          <div className="grid gap-2">
            {timeline.rows.map((row) => (
              <div key={row.key} className="flex items-stretch gap-2">
                <span
                  title={row.label}
                  className={cx(
                    'w-28 shrink-0 self-center truncate text-xs font-semibold tabular-nums',
                    row.key === 'unassigned' ? 'text-warning' : 'text-muted',
                  )}
                >
                  {row.label}
                </span>
                <div className="relative grid flex-1 gap-1 rounded-control bg-surface-muted py-1">
                  {timeline.hours.map((hour) => (
                    <span
                      key={hour.label}
                      aria-hidden="true"
                      className="absolute inset-y-0 border-l border-dashed border-line"
                      style={{ left: `${hour.left}%` }}
                    />
                  ))}
                  {row.lanes.map((lane, laneIndex) => (
                    <div key={laneIndex} className="relative h-9">
                      {lane.map((bar) => {
                        const { trip } = bar
                        const label = `${formatTime(trip.departure_time)} – ${formatTime(trip.return_time)}, ${trip.organization?.name ?? 'Organisation inconnue'}, ${trip.status_label ?? RESERVATION_STATUS_LABELS[trip.status]}`
                        const className = cx(
                          'absolute inset-y-0 flex min-w-1 items-center overflow-hidden rounded-[4px] border-l-4 px-1 text-[11px] text-ink transition',
                          STATUS_BARS[trip.status] ?? 'bg-neutral-soft border-neutral',
                          bar.past && 'opacity-55',
                          bar.live && 'ring-2 ring-primary ring-offset-1 ring-offset-surface-muted',
                          linkable && 'hover:brightness-95 focus-visible:z-10',
                        )
                        const style = { left: `${bar.left}%`, width: `${bar.width}%` }
                        const content = (
                          <span className="truncate font-semibold tracking-tight tabular-nums">{formatTime(trip.departure_time)}</span>
                        )
                        return linkable ? (
                          <Link
                            key={trip.id}
                            to={planningDayLink(trip.trip_date, trip.id)}
                            title={label}
                            aria-label={label}
                            className={className}
                            style={style}
                          >
                            {content}
                          </Link>
                        ) : (
                          <span key={trip.id} title={label} aria-label={label} role="img" className={className} style={style}>
                            {content}
                          </span>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {timeline.now != null && (
            <div aria-hidden="true" className="pointer-events-none absolute top-5 right-1 bottom-1 left-30">
              <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-danger" style={{ left: `${timeline.now}%` }}>
                <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-danger" />
              </span>
            </div>
          )}
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {statuses.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={cx('size-2.5 rounded-full', STATUS_DOTS[status])} />
            {RESERVATION_STATUS_LABELS[status]}
          </span>
        ))}
        {timeline.now != null && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-0.5 bg-danger" />
            Maintenant ({nowTime})
          </span>
        )}
      </figcaption>
    </figure>
  )
}
