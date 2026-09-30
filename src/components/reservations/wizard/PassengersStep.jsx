import { Users } from 'lucide-react'
import { cx } from '../../../lib/cx'
import { ACTIVITY_TYPE_LABELS } from '../../../lib/labels'
import { Field, Textarea } from '../../ui/Field'
import { NumberStepper } from '../../ui/NumberStepper'

const PURPOSE_MAX = 500

// Étape 2 : passagers (compteurs − / +), activité (pastilles) et motif.
// `maxPassengers` : places du plus grand bus (max_passengers de check-trip), null si inconnu :
// les compteurs sont alors libres et c'est la vérification de l'étape 3 qui refuse un bus trop petit.
export function PassengersStep({ values, setField, errors, needsJustification, maxPassengers = null }) {
  const children = Number(values.nb_children || 0)
  const adults = Number(values.nb_adults || 0)
  const total = children + adults
  const over = maxPassengers != null && total > maxPassengers

  return (
    <div className="grid gap-4.5 sm:grid-cols-2">
      <Field label="Nombre d’enfants" required error={errors.nb_children}>
        {(props) => (
          <NumberStepper
            {...props}
            value={values.nb_children}
            onChange={(value) => setField('nb_children', value)}
            max={maxPassengers != null ? maxPassengers - adults : undefined}
            decrementLabel="Un enfant de moins"
            incrementLabel="Un enfant de plus"
          />
        )}
      </Field>
      <Field label="Nombre d’adultes" required hint="Au moins un adulte accompagnant." error={errors.nb_adults}>
        {(props) => (
          <NumberStepper
            {...props}
            value={values.nb_adults}
            onChange={(value) => setField('nb_adults', value)}
            min={1}
            max={maxPassengers != null ? maxPassengers - children : undefined}
            decrementLabel="Un adulte de moins"
            incrementLabel="Un adulte de plus"
          />
        )}
      </Field>

      <div className="rounded-card border border-line bg-surface-muted p-4 sm:col-span-2" aria-live="polite">
        <p className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="inline-flex items-center gap-2 font-bold">
            <Users className="size-4.5 text-link" aria-hidden="true" />
            {total} passager{total > 1 ? 's' : ''}
          </span>
          {maxPassengers != null && (
            <span className={cx('font-semibold', over ? 'text-danger' : 'text-muted')}>
              {total} / {maxPassengers} places
            </span>
          )}
        </p>
        {maxPassengers != null && (
          <>
            <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div
                className={cx('h-full rounded-full transition-[width]', over ? 'bg-danger' : 'bg-primary')}
                style={{ width: `${Math.min(100, (total / maxPassengers) * 100)}%` }}
              />
            </div>
            {over && (
              <p className="mt-2 text-sm font-semibold text-danger">
                Le plus grand bus compte {maxPassengers} places passagers : réduisez le nombre de participants.
              </p>
            )}
          </>
        )}
      </div>

      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-bold">Type d’activité</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
            <label
              key={value}
              className={cx(
                'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold',
                'hover:border-primary has-checked:border-primary has-checked:bg-soft has-checked:text-link',
                'has-focus-visible:ring-2 has-focus-visible:ring-primary',
              )}
            >
              <input
                type="radio"
                name="activity_type"
                value={value}
                checked={values.activity_type === value}
                onChange={() => setField('activity_type', value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {errors.activity_type && <p className="mt-1.5 text-xs font-semibold text-danger">{errors.activity_type}</p>}
      </fieldset>

      <Field
        label="Motif du déplacement"
        required
        hint={
          <span className="flex justify-between gap-3">
            <span>
              {needsJustification
                ? 'Votre trajet nécessite une dérogation : expliquez ici pourquoi ces horaires sont nécessaires.'
                : 'Par exemple : sortie à la piscine, visite du musée…'}
            </span>
            <span className="shrink-0 tabular-nums">
              {values.trip_purpose.length} / {PURPOSE_MAX}
            </span>
          </span>
        }
        error={errors.trip_purpose}
        className="sm:col-span-2"
      >
        {(props) => (
          <Textarea {...props} maxLength={PURPOSE_MAX} value={values.trip_purpose} onChange={(event) => setField('trip_purpose', event.target.value)} />
        )}
      </Field>
    </div>
  )
}
