import { LoaderCircle } from 'lucide-react'
import { cx } from '../../../lib/cx'
import { getErrorMessage } from '../../../lib/errors'
import { RECURRENCE_FREQUENCY_LABELS } from '../../../lib/labels'
import { mapRecurrenceErrors, WEEK_DAYS } from '../../../lib/recurrences'
import { minTripDate } from '../../../lib/reservationForm'
import { Alert } from '../../ui/Alert'
import { Field, Input, Select } from '../../ui/Field'
import { SeriesCalendar } from './SeriesCalendar'

// Étape 2 : fréquence, jours et période, avec l'aperçu de la série en direct (useRecurrencePreview)
export function CalendarStep({ values, setField, errors, preview }) {
  // Erreurs saisies prioritaires sur l'aperçu en direct
  const fieldErrors = { ...mapRecurrenceErrors(preview.fieldErrors), ...errors }
  const globalError =
    preview.error && Object.keys(preview.fieldErrors).length === 0 ? getErrorMessage(preview.error) : null
  // Erreurs de l'aperçu qui portent sur d'autres étapes (trajet) : affichées ici pour ne pas les perdre
  const otherErrors = Object.entries(mapRecurrenceErrors(preview.fieldErrors))
    .filter(([field]) => !['frequency', 'days_of_week', 'start_date', 'end_date'].includes(field))
    .map(([, message]) => message)
  const monthly = values.frequency === 'mensuel'

  function toggleDay(day) {
    const days = values.days_of_week.includes(day)
      ? values.days_of_week.filter((item) => item !== day)
      : [...values.days_of_week, day].sort()
    setField('days_of_week', days)
  }

  return (
    <div className="grid gap-4.5 sm:grid-cols-2">
      <Field label="Fréquence" required error={fieldErrors.frequency} className="sm:col-span-2">
        {(props) => (
          <Select {...props} value={values.frequency} onChange={(event) => setField('frequency', event.target.value)}>
            {Object.entries(RECURRENCE_FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {monthly ? (
        <p className="text-sm text-muted sm:col-span-2">
          Chaque mois, le même jour que la date de début. Les dates tombant un week-end ou un jour de fermeture sont ignorées.
        </p>
      ) : (
        <fieldset className="sm:col-span-2" aria-describedby={fieldErrors.days_of_week ? 'days-error' : undefined}>
          <legend className="text-sm font-bold">
            Jours <span aria-hidden="true">*</span>
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => {
              const checked = values.days_of_week.includes(day.value)
              return (
                <label
                  key={day.value}
                  className={cx(
                    'flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3.5 text-sm font-semibold has-focus-visible:ring-2 has-focus-visible:ring-ring',
                    checked ? 'border-primary bg-primary text-on-primary' : 'border-line-strong bg-surface text-ink',
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleDay(day.value)} />
                  <span className="first-letter:uppercase">{day.label}</span>
                </label>
              )
            })}
          </div>
          {fieldErrors.days_of_week && (
            <p id="days-error" className="mt-1.5 text-xs font-semibold whitespace-pre-line text-danger">
              {fieldErrors.days_of_week}
            </p>
          )}
        </fieldset>
      )}

      <Field label="Début" required hint="Les trajets à moins de 15 jours sont ignorés." error={fieldErrors.start_date}>
        {(props) => (
          <Input {...props} type="date" min={minTripDate()} value={values.start_date} onChange={(event) => setField('start_date', event.target.value)} />
        )}
      </Field>
      <Field label="Fin" required error={fieldErrors.end_date}>
        {(props) => (
          <Input
            {...props}
            type="date"
            min={values.start_date || minTripDate()}
            value={values.end_date}
            onChange={(event) => setField('end_date', event.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-3 sm:col-span-2" aria-live="polite">
        {preview.pending && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Calcul des dates de la série…
          </p>
        )}
        {globalError && <Alert tone="danger">{globalError}</Alert>}
        {otherErrors.length > 0 && (
          <Alert tone="danger" title="À corriger dans le trajet">
            <p className="whitespace-pre-line">{otherErrors.join('\n')}</p>
          </Alert>
        )}
        {preview.result && <SeriesCalendar preview={preview.result} />}
      </div>
    </div>
  )
}
