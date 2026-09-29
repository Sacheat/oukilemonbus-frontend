import { LoaderCircle } from 'lucide-react'
import { formatDate } from '../../../lib/dates'
import { ACTIVITY_TYPE_LABELS } from '../../../lib/labels'
import { describeFrequency } from '../../../lib/recurrences'
import { shortAddress } from '../../../lib/reservations'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { ErrorState } from '../../ui/ErrorState'
import { SeriesCalendar } from './SeriesCalendar'

// Étape 4 : récapitulatif + aperçu final de la série (avec les vrais passagers)
export function RecurrenceReviewStep({ values, organization, preview, onRetry, onEditStep }) {
  const result = preview.result
  return (
    <div className="grid gap-5">
      <ReviewSection
        title="Trajet"
        onEdit={() => onEditStep(1)}
        items={[
          ['Organisation', organization?.name],
          ['Horaires', `Départ ${values.departure_time} · retour ${values.return_time}`],
          ['Prise en charge', shortAddress(values.pickup)],
          ['Destination', shortAddress(values.destination)],
        ]}
      />
      <ReviewSection
        title="Calendrier"
        onEdit={() => onEditStep(2)}
        items={[
          ['Fréquence', describeFrequency(values)],
          ['Période', `Du ${formatDate(values.start_date)} au ${formatDate(values.end_date)}`],
        ]}
      />
      <ReviewSection
        title="Passagers"
        onEdit={() => onEditStep(3)}
        items={[
          ['Enfants', values.nb_children || '0'],
          ['Adultes', values.nb_adults],
          ['Activité', ACTIVITY_TYPE_LABELS[values.activity_type]],
          ['Motif', values.trip_purpose],
        ]}
      />

      <div className="grid gap-3" aria-live="polite">
        {preview.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Vérification complète de la série…
          </p>
        )}
        {preview.status === 'error' && <ErrorState error={preview.error} onRetry={onRetry} />}
        {result && preview.status === 'done' && (
          <>
            {result.total_valid_occurrences > 0 && (
              <Alert tone="success" title="Approbation automatique">
                Les trajets de la série seront approuvés dès l’envoi, puis le chauffeur et le véhicule seront affectés.
              </Alert>
            )}
            <SeriesCalendar preview={result} />
          </>
        )}
      </div>
    </div>
  )
}

function ReviewSection({ title, onEdit, items }) {
  const id = `review-${title.toLowerCase()}`
  return (
    <section aria-labelledby={id} className="rounded-[10px] border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id={id} className="font-bold">
          {title}
        </h3>
        <Button variant="link" className="text-sm" onClick={onEdit}>
          Modifier
        </Button>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
        {items.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="font-semibold break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
