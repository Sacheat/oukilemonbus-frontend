import { LoaderCircle } from 'lucide-react'
import { formatDate } from '../../../lib/dates'
import { ACTIVITY_TYPE_LABELS } from '../../../lib/labels'
import { agentEditDecision, draftReservation, reservationDecision } from '../../../lib/reservationForm'
import { shortAddress } from '../../../lib/reservations'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Field'
import { ErrorState } from '../../ui/ErrorState'
import { TripHero } from '../TripHero'
import { DecisionBanner } from './DecisionBanner'
import { AvailabilityNotice, ConflictsList, WarningsList } from './PreviewResult'
import { TripCheckFacts } from './TripCheckFacts'

// Étape 3 : billet de la demande, ce qu'elle deviendra à l'envoi (preview complet, avec les vrais passagers),
// trajet calculé, puis le détail des informations saisies (avant → après en modification)
export function ReviewStep({
  agent = false,
  currentStatus = null,
  values,
  original = null,
  changes = null,
  organization,
  preview,
  onRetry,
  onEditStep,
  onUseSlot,
  acknowledged,
  setAcknowledged,
}) {
  const result = preview.result
  const mode = original ? 'edit' : 'create'
  const rowProps = { values, original, changes }
  // En modification : lignes dont au moins un champ a changé, rappelées en tête
  const changedRows = changes ? [...TRIP_ROWS, ...PASSENGER_ROWS].filter((row) => row.fields.some((field) => changes.includes(field))) : []
  return (
    <div className="grid gap-5">
      {changes && changes.length === 0 && (
        <Alert tone="info">Vous n’avez encore rien modifié. Revenez aux étapes précédentes pour changer la réservation.</Alert>
      )}

      {changedRows.length > 0 && (
        <section aria-labelledby="review-changes" className="rounded-card border border-warning-line bg-surface p-4">
          <h3 id="review-changes" className="font-bold">
            {agent ? 'Changements' : 'Vos changements'} <span className="font-normal text-muted">({changedRows.length})</span>
          </h3>
          <dl className={LIST_CLASSES}>
            {changedRows.map((row) => (
              <Row key={row.label} {...row} {...rowProps} />
            ))}
          </dl>
        </section>
      )}

      <TripHero
        reservation={draftReservation(values, preview.status === 'done' ? result : null)}
        eyebrow={agent ? 'Réservation modifiée' : mode === 'edit' ? 'Votre réservation modifiée' : 'Aperçu de votre demande'}
        titleAs="h3"
        showStatus={false}
      />

      <div className="grid gap-3" aria-live="polite">
        {preview.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> {agent ? 'Vérification complète de la réservation…' : 'Vérification complète de votre demande…'}
          </p>
        )}
        {preview.status === 'error' && <ErrorState error={preview.error} onRetry={onRetry} />}
        {result && preview.status === 'done' && (
          <>
            <DecisionBanner
              decision={agent ? agentEditDecision(result, currentStatus) : reservationDecision(result, mode)}
              eyebrow={mode === 'edit' ? 'Après l’enregistrement' : 'Après l’envoi'}
            />
            <AvailabilityNotice availability={result.availability} onUseSlot={onUseSlot} />
            <ConflictsList conflicts={result.conflicts} />
            {result.warnings?.length > 0 && (
              <>
                <WarningsList warnings={result.warnings} />
                <p className="text-sm text-muted">
                  Justifiez ces horaires dans le motif du déplacement{' '}
                  <Button variant="link" className="text-sm" onClick={() => onEditStep(2)}>
                    (modifier le motif)
                  </Button>
                  .
                </p>
                <Checkbox
                  label="J’ai pris connaissance que ces horaires nécessitent une dérogation soumise au Collège."
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
              </>
            )}
            <TripCheckFacts result={result} title="Trajet calculé" />
          </>
        )}
      </div>
      <section aria-labelledby="review-trip" className="rounded-[10px] border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 id="review-trip" className="font-bold">
            Trajet
          </h3>
          <Button variant="link" className="text-sm" onClick={() => onEditStep(1)}>
            Modifier
          </Button>
        </div>
        <dl className={LIST_CLASSES}>
          <Row label="Organisation" {...rowProps} fields={[]} render={() => organization?.name} />
          {TRIP_ROWS.map((row) => (
            <Row key={row.label} {...row} {...rowProps} />
          ))}
        </dl>
      </section>

      <section aria-labelledby="review-passengers" className="rounded-[10px] border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 id="review-passengers" className="font-bold">
            Passagers
          </h3>
          <Button variant="link" className="text-sm" onClick={() => onEditStep(2)}>
            Modifier
          </Button>
        </div>
        <dl className={LIST_CLASSES}>
          {PASSENGER_ROWS.map((row) => (
            <Row key={row.label} {...row} {...rowProps} />
          ))}
        </dl>
      </section>
    </div>
  )
}

// Lignes du récapitulatif : libellé, champs du formulaire concernés, rendu d'une valeur
const TRIP_ROWS = [
  { label: 'Date', fields: ['trip_date'], render: (v) => formatDate(v.trip_date) },
  { label: 'Horaires', fields: ['departure_time', 'return_time'], render: (v) => `Départ ${v.departure_time} · retour ${v.return_time}` },
  { label: 'Prise en charge', fields: ['pickup'], render: (v) => shortAddress(v.pickup) },
  { label: 'Destination', fields: ['destination'], render: (v) => shortAddress(v.destination) },
]
const PASSENGER_ROWS = [
  { label: 'Enfants', fields: ['nb_children'], render: (v) => v.nb_children || '0' },
  { label: 'Adultes', fields: ['nb_adults'], render: (v) => v.nb_adults },
  { label: 'Activité', fields: ['activity_type'], render: (v) => ACTIVITY_TYPE_LABELS[v.activity_type] },
  { label: 'Motif', fields: ['trip_purpose'], render: (v) => v.trip_purpose },
]

const LIST_CLASSES = 'mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]'

// Ligne du récapitulatif ; en modification, un champ changé montre l'ancienne valeur barrée
function Row({ label, fields, render, values, original, changes }) {
  const changed = Boolean(changes && fields.some((field) => changes.includes(field)))
  return (
    <div className="contents">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold break-words">
        {changed && (
          <>
            <del className="font-normal text-muted">{render(original)}</del>
            <span aria-hidden="true"> → </span>
            <span className="sr-only">, remplacé par </span>
          </>
        )}
        <span className={changed ? 'rounded bg-warning-soft px-1 text-warning' : undefined}>{render(values)}</span>
        {changed && <span className="sr-only"> (modifié)</span>}
      </dd>
    </div>
  )
}
