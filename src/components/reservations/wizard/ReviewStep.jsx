import { LoaderCircle } from 'lucide-react'
import { formatDate } from '../../../lib/dates'
import { ACTIVITY_TYPE_LABELS } from '../../../lib/labels'
import { shortAddress } from '../../../lib/reservations'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Checkbox } from '../../ui/Field'
import { ErrorState } from '../../ui/ErrorState'
import { ApprovalNotice, AvailabilityNotice, ConflictsList, TripFacts, WarningsList } from './PreviewResult'

// Étape 3 : récapitulatif + résultat du preview complet (avec les vrais passagers)
export function ReviewStep({
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
  const rowProps = { values, original, changes }
  return (
    <div className="grid gap-5">
      {changes && changes.length === 0 && (
        <Alert tone="info">Vous n’avez encore rien modifié. Revenez aux étapes précédentes pour changer la réservation.</Alert>
      )}
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
          <Row label="Date" {...rowProps} fields={['trip_date']} render={(v) => formatDate(v.trip_date)} />
          <Row
            label="Horaires"
            {...rowProps}
            fields={['departure_time', 'return_time']}
            render={(v) => `Départ ${v.departure_time} · retour ${v.return_time}`}
          />
          <Row label="Prise en charge" {...rowProps} fields={['pickup']} render={(v) => shortAddress(v.pickup)} />
          <Row label="Destination" {...rowProps} fields={['destination']} render={(v) => shortAddress(v.destination)} />
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
          <Row label="Enfants" {...rowProps} fields={['nb_children']} render={(v) => v.nb_children || '0'} />
          <Row label="Adultes" {...rowProps} fields={['nb_adults']} render={(v) => v.nb_adults} />
          <Row label="Activité" {...rowProps} fields={['activity_type']} render={(v) => ACTIVITY_TYPE_LABELS[v.activity_type]} />
          <Row label="Motif" {...rowProps} fields={['trip_purpose']} render={(v) => v.trip_purpose} />
        </dl>
      </section>

      <div className="grid gap-3" aria-live="polite">
        {preview.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Vérification complète de votre demande…
          </p>
        )}
        {preview.status === 'error' && <ErrorState error={preview.error} onRetry={onRetry} />}
        {result && preview.status === 'done' && (
          <>
            {!result.is_allowed && (
              <Alert tone="danger" title="Cette demande ne peut pas être envoyée en l’état">
                Modifiez le trajet ou les horaires puis relancez la vérification.
              </Alert>
            )}
            <ApprovalNotice result={result} />
            <div className="rounded-[10px] border border-line bg-surface-muted p-4">
              <p className="mb-2 text-sm font-bold">Trajet calculé</p>
              <TripFacts result={result} />
            </div>
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
          </>
        )}
      </div>
    </div>
  )
}

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
