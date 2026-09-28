import { LoaderCircle } from 'lucide-react'
import { mapApiErrors, minTripDate, PRIORITY_ORGANIZATION_TYPES } from '../../../lib/reservationForm'
import { getErrorMessage } from '../../../lib/errors'
import { Alert } from '../../ui/Alert'
import { Field, Input, Select } from '../../ui/Field'
import { LocationPicker } from '../LocationPicker'
import { AvailabilityNotice, TripFacts, WarningsList } from './PreviewResult'

// Étape 1 : organisation, date, horaires et lieux, vérifiés en direct (useTripCheck)
export function TripStep({ values, setField, errors, organizations, lockOrganization = false, tripCheck, onUseSlot }) {
  const organization = organizations.find((item) => String(item.id) === String(values.organization_id))
  const isPriority = organization && PRIORITY_ORGANIZATION_TYPES.includes(organization.type)
  // Erreurs saisies (champ vide, retour de l'étape 3) prioritaires sur la vérification en direct
  const fieldErrors = { ...mapApiErrors(tripCheck.fieldErrors), ...errors }
  const globalCheckError =
    tripCheck.error && Object.keys(tripCheck.fieldErrors).length === 0 ? getErrorMessage(tripCheck.error) : null

  return (
    <div className="grid gap-4.5 sm:grid-cols-2">
      <Field
        label="Organisation concernée"
        required={!lockOrganization}
        hint={lockOrganization ? 'L’organisation d’une réservation ne peut pas être modifiée.' : null}
        error={fieldErrors.organization_id}
        className="sm:col-span-2"
      >
        {(props) =>
          lockOrganization ? (
            // L'organisation d'une réservation existante ne peut pas être changée
            <Input {...props} value={organization?.name ?? ''} readOnly className="bg-surface-muted" />
          ) : (
            <Select {...props} value={values.organization_id} onChange={(event) => setField('organization_id', event.target.value)}>
              {organizations.length > 1 && <option value="">Choisir une organisation</option>}
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          )
        }
      </Field>

      <Field
        label="Date du trajet"
        required
        hint="Au moins 15 jours à l’avance, du lundi au vendredi."
        error={fieldErrors.trip_date}
      >
        {(props) => (
          <Input {...props} type="date" min={minTripDate()} value={values.trip_date} onChange={(event) => setField('trip_date', event.target.value)} />
        )}
      </Field>

      <Field
        label="Heure de départ"
        required
        hint={isPriority ? null : 'Après 07:30, sinon dérogation.'}
        error={fieldErrors.departure_time}
      >
        {(props) => (
          <Input {...props} type="time" step={300} value={values.departure_time} onChange={(event) => setField('departure_time', event.target.value)} />
        )}
      </Field>

      <Field label="Lieu de prise en charge" required error={fieldErrors.pickup}>
        {(props) => <LocationPicker inputProps={props} value={values.pickup} onChange={(location) => setField('pickup', location)} />}
      </Field>

      <Field
        label="Destination"
        required
        hint="En Belgique, à 50 km maximum."
        error={fieldErrors.destination}
      >
        {(props) => (
          <LocationPicker inputProps={props} value={values.destination} onChange={(location) => setField('destination', location)} />
        )}
      </Field>

      <Field
        label="Heure de départ pour le retour"
        required
        hint={isPriority ? null : 'Retour avant 16:00 et 5 h maximum au total, sinon dérogation soumise au Collège.'}
        error={fieldErrors.return_time}
        className="sm:col-span-2"
      >
        {(props) => (
          <Input {...props} type="time" step={300} value={values.return_time} onChange={(event) => setField('return_time', event.target.value)} />
        )}
      </Field>

      <div className="grid gap-3 sm:col-span-2" aria-live="polite">
        {tripCheck.pending && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Vérification du trajet…
          </p>
        )}
        {globalCheckError && <Alert tone="danger">{globalCheckError}</Alert>}
        {tripCheck.result && (
          <>
            <div className="rounded-[10px] border border-line bg-surface-muted p-4">
              <p className="mb-2 text-sm font-bold">Trajet vérifié</p>
              <TripFacts result={tripCheck.result} />
            </div>
            <AvailabilityNotice availability={tripCheck.result.availability} onUseSlot={onUseSlot} />
            <WarningsList warnings={tripCheck.result.warnings} />
          </>
        )}
      </div>
    </div>
  )
}
