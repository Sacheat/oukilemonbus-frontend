import { Ban, Check, CheckCheck, Landmark, RefreshCw, Repeat, TriangleAlert, UserRoundCog, X } from 'lucide-react'
import { useCallback } from 'react'
import { getUser } from '../../api/users'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { formatDate, formatDateTime, formatTime } from '../../lib/dates'
import { DECISION_STATUS } from '../../lib/documents'
import { estimatedArrivals, shortAddress, totalPassengers } from '../../lib/reservations'
import { keyLabel } from '../../lib/shortcuts'
import { TripLeg } from '../reservations/TripLeg'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { DetailList } from '../ui/DetailList'
import { StatusBadge } from '../ui/StatusBadge'

// Touche d'un raccourci affichée dans un bouton, en grand écran (décorative : l'aide « ? » les liste)
function Kbd({ children }) {
  return (
    <kbd aria-hidden="true" className="ml-1 hidden rounded border border-current/30 px-1 font-sans text-[11px] leading-4 opacity-70 lg:inline">
      {children}
    </kbd>
  )
}

// Détail d'une réservation dans l'espace gestion, à côté de la file : trajet, informations, conflits et
// actions de l'agent. `actions` : actions permises (agentActions) ; `onAction(nom)` : approve, confirm,
// retryAssign, assign, reject, cancel ; `busy` : action en cours ; `keys` : touches des raccourcis ;
// `driverName(id)` : nom d'un chauffeur ; `onResolve(conflit)` : marquer un conflit comme résolu.
// `decision` : décision du Collège (validation manuelle), `undefined` pendant le chargement.
// `onClose` : absent dans le panneau glissant du mobile, qui a son propre bouton de fermeture.
export function ReservationPanel({ reservation, decision, actions, onAction, busy, keys, driverName, onResolve, resolving, onClose }) {
  const fetchRequester = useCallback(
    (signal) => (reservation.requested_by_user_id ? getUser(reservation.requested_by_user_id, { signal }) : Promise.resolve(null)),
    [reservation.requested_by_user_id],
  )
  const requester = useApi(fetchRequester)
  const arrivals = estimatedArrivals(reservation)
  // Le panneau est étroit : les villes sur le trajet, les adresses complètes dans les informations
  const from = reservation.pickup_location?.city || shortAddress(reservation.pickup_location)
  const to = reservation.destination_location?.city || shortAddress(reservation.destination_location)
  const conflicts = reservation.conflicts ?? []
  const openConflicts = conflicts.filter((conflict) => !conflict.is_resolved)

  return (
    <article aria-labelledby="panel-title" className="flex h-full flex-col">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={reservation.status} label={reservation.status_label} />
            <span>n° {reservation.id}</span>
            {reservation.recurrence_id && (
              <span className="inline-flex items-center gap-1 font-semibold text-link">
                <Repeat className="size-3.5" aria-hidden="true" /> Série
              </span>
            )}
          </div>
          <h2 id="panel-title" className="mt-1 text-lg leading-snug font-bold break-words">
            {reservation.trip_purpose}
          </h2>
          <p className="text-sm text-muted first-letter:uppercase">
            {formatDate(reservation.trip_date)} · {reservation.organization?.name}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le détail"
            className="grid size-11 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {openConflicts.length > 0 && (
          <section aria-labelledby="panel-conflicts" className="rounded-card border border-conflict/40 bg-conflict-soft p-3.5">
            <h3 id="panel-conflicts" className="flex items-center gap-2 text-sm font-bold text-conflict">
              <TriangleAlert className="size-4" aria-hidden="true" />
              {openConflicts.length} conflit{openConflicts.length > 1 ? 's' : ''} à régler
            </h3>
            <ul className="mt-2 grid gap-2">
              {openConflicts.map((conflict) => (
                <li key={conflict.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <strong className="block">{conflict.type_label}</strong>
                    <span className="text-muted">{conflict.message}</span>
                  </span>
                  {actions.resolveConflicts && (
                    <Button
                      variant="secondary"
                      className="text-sm"
                      onClick={() => onResolve(conflict)}
                      loading={resolving === conflict.id}
                      disabled={resolving !== null}
                    >
                      <Check className="size-4" aria-hidden="true" /> Résolu
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {reservation.approval_type === 'manuel' && (
          <section aria-labelledby="panel-council" className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line p-3.5">
            <div className="min-w-0">
              <h3 id="panel-council" className="flex items-center gap-2 text-sm font-bold">
                <Landmark className="size-4 text-muted" aria-hidden="true" /> Décision du Collège
              </h3>
              {decision === undefined ? (
                <p className="text-sm text-muted">Chargement…</p>
              ) : decision ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={DECISION_STATUS[decision.decision_status]?.tone}>
                    {DECISION_STATUS[decision.decision_status]?.label ?? decision.decision_status}
                  </Badge>
                  <span className="text-muted">
                    {[decision.decision_date && formatDate(decision.decision_date, { day: 'numeric', month: 'long', year: 'numeric' }), decision.decision_reference && `réf. ${decision.decision_reference}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted">Aucune décision enregistrée.</p>
              )}
            </div>
            {actions.council && decision !== undefined && (
              <Button variant="secondary" className="text-sm" onClick={() => onAction('council')} disabled={busy !== null}>
                {decision ? 'Modifier' : 'Enregistrer la décision'} <Kbd>{keyLabel(keys.council)}</Kbd>
              </Button>
            )}
          </section>
        )}

        <section aria-label="Trajet" className="grid gap-3 rounded-card border border-line p-3.5">
          <TripLeg variant="card" label="Aller" departure={formatTime(reservation.departure_time)} arrival={arrivals?.outbound} from={from} to={to} />
          <TripLeg variant="card" label="Retour" departure={formatTime(reservation.return_time)} arrival={arrivals?.back} from={to} to={from} />
        </section>

        <DetailList
          items={[
            ['Demandeur', requester.data ? `${requester.data.full_name} · ${requester.data.email}` : '…'],
            ['Prise en charge', shortAddress(reservation.pickup_location)],
            ['Destination', shortAddress(reservation.destination_location)],
            [
              'Passagers',
              `${totalPassengers(reservation)} (${reservation.nb_children} enfant${reservation.nb_children > 1 ? 's' : ''}, ${reservation.nb_adults} adulte${reservation.nb_adults > 1 ? 's' : ''})${reservation.passengers_confirmed_at ? ' · confirmés' : ''}`,
            ],
            ['Activité', reservation.activity_type_label],
            ['Validation', reservation.approval_type_label],
            reservation.distance_km != null && [
              'Distance',
              `${Number(reservation.distance_km).toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km · ${reservation.estimated_duration_min} min`,
            ],
            ['Chauffeur', reservation.driver_id ? driverName(reservation.driver_id) : 'Pas encore affecté'],
            ['Véhicule', reservation.vehicle ? `${reservation.vehicle.licence_plate} · ${reservation.vehicle.capacity} places` : 'Pas encore affecté'],
            reservation.rejection_reason && ['Motif du refus', reservation.rejection_reason],
            reservation.cancellation_reason && ['Motif de l’annulation', reservation.cancellation_reason],
            ['Demande envoyée', formatDateTime(reservation.created_at)],
          ]}
        />

        {conflicts.length > openConflicts.length && (
          <p className="text-xs text-muted">
            {conflicts.length - openConflicts.length} conflit{conflicts.length - openConflicts.length > 1 ? 's' : ''} déjà résolu
            {conflicts.length - openConflicts.length > 1 ? 's' : ''}.
          </p>
        )}
      </div>

      {(actions.approve || actions.approveBlocked || actions.confirm || actions.assign || actions.retryAssign || actions.reject || actions.cancel) && (
        <footer className="grid gap-2 border-t border-line bg-surface px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {(actions.approve || actions.approveBlocked) && (
              <Button
                onClick={() => onAction('approve')}
                loading={busy === 'approve'}
                disabled={busy !== null || actions.approveBlocked}
                aria-describedby={actions.approveBlocked ? 'approve-blocked' : undefined}
              >
                <Check className="size-4" aria-hidden="true" /> Approuver <Kbd>{keyLabel(keys.approve)}</Kbd>
              </Button>
            )}
            {actions.confirm && (
              <Button onClick={() => onAction('confirm')} loading={busy === 'confirm'} disabled={busy !== null}>
                <CheckCheck className="size-4" aria-hidden="true" /> Confirmer <Kbd>{keyLabel(keys.confirm)}</Kbd>
              </Button>
            )}
            {actions.assign && (
              <Button variant="secondary" onClick={() => onAction('assign')} disabled={busy !== null}>
                <UserRoundCog className="size-4" aria-hidden="true" /> Affecter <Kbd>{keyLabel(keys.assign)}</Kbd>
              </Button>
            )}
            {actions.retryAssign && (
              <Button variant="secondary" onClick={() => onAction('retryAssign')} loading={busy === 'retryAssign'} disabled={busy !== null}>
                <RefreshCw className="size-4" aria-hidden="true" /> Affectation auto
              </Button>
            )}
          </div>
          <div className={cx('flex flex-wrap gap-2', !(actions.reject || actions.cancel) && 'hidden')}>
            {actions.reject && (
              <Button variant="secondary" className="text-danger" onClick={() => onAction('reject')} disabled={busy !== null}>
                <X className="size-4" aria-hidden="true" /> Refuser <Kbd>{keyLabel(keys.reject)}</Kbd>
              </Button>
            )}
            {actions.cancel && (
              <Button variant="secondary" className="text-danger" onClick={() => onAction('cancel')} disabled={busy !== null}>
                <Ban className="size-4" aria-hidden="true" /> Annuler
              </Button>
            )}
          </div>
          {actions.approveBlocked && (
            <p id="approve-blocked" className="text-xs text-muted">
              Approbation possible après une décision favorable du Collège.
            </p>
          )}
          {reservation.status === 'approuve' && !actions.confirm && openConflicts.length === 0 && (
            <Alert tone="info" className="py-2">
              Pour confirmer, affectez un chauffeur et un véhicule.
            </Alert>
          )}
        </footer>
      )}
    </article>
  )
}
