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
export function ReviewStep({ values, organization, preview, onRetry, onEditStep, onUseSlot, acknowledged, setAcknowledged }) {
  const result = preview.result
  return (
    <div className="grid gap-5">
      <section aria-labelledby="review-trip" className="rounded-[10px] border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 id="review-trip" className="font-bold">
            Trajet
          </h3>
          <Button variant="link" className="text-sm" onClick={() => onEditStep(1)}>
            Modifier
          </Button>
        </div>
        <Summary
          items={[
            ['Organisation', organization?.name],
            ['Date', formatDate(values.trip_date)],
            ['Horaires', `Départ ${values.departure_time} · retour ${values.return_time}`],
            ['Prise en charge', shortAddress(values.pickup)],
            ['Destination', shortAddress(values.destination)],
          ]}
        />
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
        <Summary
          items={[
            ['Enfants', values.nb_children || '0'],
            ['Adultes', values.nb_adults],
            ['Activité', ACTIVITY_TYPE_LABELS[values.activity_type]],
            ['Motif', values.trip_purpose],
          ]}
        />
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

function Summary({ items }) {
  return (
    <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="font-semibold break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
