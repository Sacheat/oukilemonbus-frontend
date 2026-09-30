import { createVehicle, updateVehicle } from '../../api/vehicles'
import { useForm } from '../../hooks/useForm'
import { vehicleFormValues } from '../../lib/vehicles'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'

// Formulaire d'ajout (sans `vehicle`) ou de modification (avec `vehicle`).
// Les erreurs 422 (plaque déjà utilisée…) s'affichent sous le champ concerné.
export function VehicleForm({ vehicle, onSaved }) {
  const form = useForm(vehicleFormValues(vehicle))
  const isEditing = Boolean(vehicle)

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) =>
      isEditing ? updateVehicle(vehicle.id, values) : createVehicle(values),
    )
    if (result.ok) onSaved(result.data, isEditing)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      <Field label="Plaque d'immatriculation" error={form.errors.licence_plate} required>
        {(props) => (
          <Input
            {...props}
            value={form.values.licence_plate}
            onChange={form.handle('licence_plate')}
            maxLength={20}
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="Capacité" hint="Nombre de places, chauffeur compris." error={form.errors.capacity} required>
        {(props) => (
          <Input
            {...props}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={form.values.capacity}
            onChange={form.handle('capacity')}
          />
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          {isEditing ? 'Enregistrer' : 'Ajouter le véhicule'}
        </Button>
      </div>
    </form>
  )
}
