import { overlapTimeline } from '../../lib/conflicts'

// Frise d'une journée : occupation du bus par cette réservation et par celle en face, zone qui se chevauche
// en hachures. Les barres incluent trajet retour et marges (estimated_occupation du backend).
export function OccupationTimeline({ current, other }) {
  const timeline = overlapTimeline(current, other)
  if (!timeline) return null

  const rows = [
    { key: 'current', label: `n° ${current.id}`, bar: timeline.current, className: 'bg-primary' },
    { key: 'other', label: `n° ${other.id}`, bar: timeline.other, className: 'bg-conflict' },
  ]

  return (
    <figure className="grid gap-1.5">
      <div className="relative grid gap-1.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-[11px] font-semibold text-muted tabular-nums">{row.label}</span>
            <div className="relative h-4 flex-1 rounded-full bg-surface-muted">
              <span
                className={`absolute inset-y-0 rounded-full ${row.className}`}
                style={{ left: `${row.bar.left}%`, width: `${row.bar.width}%` }}
              />
              {timeline.shared && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,transparent_0_3px,rgb(255_255_255/.55)_3px_6px)]"
                  style={{ left: `${timeline.shared.left}%`, width: `${timeline.shared.width}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="relative ml-14 h-4 text-[10px] text-muted tabular-nums" aria-hidden="true">
        {timeline.hours.map((hour) => (
          <span key={hour.label} className="absolute -translate-x-1/2" style={{ left: `${hour.left}%` }}>
            {hour.label}
          </span>
        ))}
      </div>
      <figcaption className="text-xs text-muted">
        Occupation du bus (trajets et marges comprises) : {timeline.sharedMinutes} min en commun.
      </figcaption>
    </figure>
  )
}
