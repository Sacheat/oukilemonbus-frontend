import { formatDate, formatTime } from '../../lib/dates'

// Décision déjà prise (onglets « Approuvées » et « Refusées »), en ligne compacte sous l'en-tête du jour du trajet :
// heure, motif et organisation, séance et référence. Le statut est celui de l'onglet : pas répété sur la ligne.
// Ouvre le panneau de la réservation.
export function CollegeDecisionRow({ decision, onOpen }) {
  const reservation = decision.reservation

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(decision.reservation_id)}
        className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-muted"
      >
        <span className="w-12 shrink-0 text-sm font-bold tabular-nums">{formatTime(reservation?.departure_time)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{reservation?.trip_purpose ?? `Réservation n° ${decision.reservation_id}`}</span>
          <span className="block truncate text-sm text-muted">
            {[
              reservation?.organization?.name,
              decision.decision_date
                ? `séance du ${formatDate(decision.decision_date, { day: 'numeric', month: 'long', year: 'numeric' })}`
                : 'séance non renseignée',
              decision.decision_reference && `réf. ${decision.decision_reference}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <span className="shrink-0 text-xs text-muted tabular-nums">n° {decision.reservation_id}</span>
      </button>
    </li>
  )
}
