import { Bus, UserRound } from 'lucide-react'
import { createUnavailability, updateUnavailability } from '../../api/unavailabilities'
import { useForm } from '../../hooks/useForm'
import { cx } from '../../lib/cx'
import { driverOptions, unavailabilityFormValues, vehicleOptions } from '../../lib/unavailabilities'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'

const REASON_TYPES = [
  { value: 'driver', label: 'Un chauffeur', icon: UserRound },
  { value: 'vehicle', label: 'Un véhicule', icon: Bus },
]

// Déclaration (sans `unavailability`) ou modification (avec) d'une indisponibilité.
// Début et fin sont saisis en heure de Bruxelles et envoyés tels quels, sans conversion de fuseau.
export function UnavailabilityForm({ unavailability, driverList, vehicleList, onSaved }) {
  const form = useForm(unavailabilityFormValues(unavailability))
  const isEditing = Boolean(unavailability)
  const reasonType = form.values.reason_type

  function chooseReasonType(value) {
    form.setValues((values) => ({ ...values, reason_type: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) =>
      isEditing ? updateUnavailability(unavailability.id, values) : createUnavailability(values),
    )
    if (result.ok) onSaved(result.data, isEditing)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      <fieldset className="text-sm font-bold">
        <legend>
          Qui est indisponible ?<span aria-hidden="true"> *</span>
        </legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {REASON_TYPES.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className={cx(
                'flex min-h-11.5 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-semibold',
                reasonType === value ? 'border-primary bg-surface-muted' : 'border-line-strong bg-surface',
              )}
            >
              <input
                type="radio"
                name="reason_type"
                value={value}
                checked={reasonType === value}
                onChange={() => chooseReasonType(value)}
                className="size-4 accent-primary"
              />
              <Icon className="size-4 text-muted" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
        {form.errors.reason_type && (
          <p className="mt-1.5 text-xs font-semibold whitespace-pre-line text-danger">{form.errors.reason_type}</p>
        )}
      </fieldset>

      {reasonType === 'driver' && (
        <Field label="Chauffeur" error={form.errors.driver_id} required>
          {(props) => (
            <Select {...props} value={form.values.driver_id} onChange={form.handle('driver_id')}>
              <option value="">Choisir un chauffeur</option>
              {driverOptions(driverList, unavailability?.driver_id).map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.user?.full_name ?? `Chauffeur n° ${driver.id}`}
                  {driver.is_active ? '' : ' (désactivé)'}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      {reasonType === 'vehicle' && (
        <Field label="Véhicule" error={form.errors.vehicle_id} required>
          {(props) => (
            <Select {...props} value={form.values.vehicle_id} onChange={form.handle('vehicle_id')}>
              <option value="">Choisir un véhicule</option>
              {vehicleOptions(vehicleList, unavailability?.vehicle_id).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licence_plate}
                  {vehicle.is_active ? '' : ' (retiré du service)'}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Début" error={form.errors.start_datetime} required>
          {(props) => (
            <Input
              {...props}
              type="datetime-local"
              value={form.values.start_datetime}
              onChange={form.handle('start_datetime')}
            />
          )}
        </Field>
        <Field label="Fin" error={form.errors.end_datetime} required>
          {(props) => (
            <Input
              {...props}
              type="datetime-local"
              min={form.values.start_datetime || undefined}
              value={form.values.end_datetime}
              onChange={form.handle('end_datetime')}
            />
          )}
        </Field>
      </div>

      <Field label="Motif" hint="Facultatif. Par exemple : maladie, entretien, contrôle technique." error={form.errors.reason}>
        {(props) => <Textarea {...props} maxLength={500} value={form.values.reason} onChange={form.handle('reason')} />}
      </Field>

      {isEditing && (
        <Field
          label="Raison de la modification"
          hint="Facultatif. Conservée dans l'historique de l'indisponibilité."
          error={form.errors.change_reason}
        >
          {(props) => (
            <Textarea {...props} maxLength={500} value={form.values.change_reason} onChange={form.handle('change_reason')} />
          )}
        </Field>
      )}

      <Alert tone="warning">
        Les réservations affectées à ce chauffeur ou à ce véhicule sur cette période perdront leur affectation et
        passeront en conflit.
      </Alert>

      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          {isEditing ? 'Enregistrer' : "Déclarer l'indisponibilité"}
        </Button>
      </div>
    </form>
  )
}
