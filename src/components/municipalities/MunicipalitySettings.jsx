import { useState } from 'react'
import { updateMunicipality } from '../../api/municipalities'
import { useForm } from '../../hooks/useForm'
import { DISTANCE_FIELDS, distanceInKm, referencePoint, settingsChanges, settingsFormValues } from '../../lib/municipalities'
import { LocationPicker } from '../reservations/LocationPicker'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Panel } from '../ui/Panel'
import { DistanceField } from './DistanceField'
import { PickupZoneMap } from './PickupZoneMap'

// Réglages de la commune active appliqués aux réservations : identité, dépôt du bus et limites de distance,
// avec la carte de la zone de prise en charge qui suit la saisie. Seuls les champs modifiés sont envoyés ; bouton
// désactivé sans changement. `notice` : message après l'enregistrement, masqué dès la modification suivante.
export function MunicipalitySettings({ municipality, notice, onSaved }) {
  const form = useForm(settingsFormValues(municipality))
  const [depot, setDepot] = useState(municipality.depot_location ?? null)
  const point = referencePoint(municipality, depot)
  const pickupKm = distanceInKm(form.values, 'max_pickup_distance_km')
  const changes = settingsChanges(municipality, form.values, depot)
  const dirty = Object.keys(changes).length > 0

  async function handleSubmit(event) {
    event.preventDefault()
    if (!dirty) return
    const result = await form.submit(() => updateMunicipality(municipality.id, changes))
    if (result.ok) onSaved(result.data)
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-2">
      <Panel title="Règles des réservations">
        <form onSubmit={handleSubmit} noValidate className="grid gap-5 p-5">
          {notice && !dirty && <Alert tone="success">{notice}</Alert>}
          {form.error && <Alert tone="danger">{form.error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field label="Nom" error={form.errors.name} required>
              {(props) => <Input {...props} value={form.values.name} onChange={form.handle('name')} maxLength={100} />}
            </Field>
            <Field label="Code postal" error={form.errors.postal_code}>
              {(props) => <Input {...props} value={form.values.postal_code} onChange={form.handle('postal_code')} maxLength={20} />}
            </Field>
            <Field label="Code INS" error={form.errors.nis_code}>
              {(props) => <Input {...props} value={form.values.nis_code} onChange={form.handle('nis_code')} maxLength={20} />}
            </Field>
          </div>

          <Field
            label="Dépôt du bus"
            hint="Point de départ de la distance du lieu de départ. Sans dépôt, elle se mesure depuis le centre de la commune."
            error={form.errors.depot_location_id}
          >
            {(props) => (
              <LocationPicker value={depot} onChange={setDepot} inputProps={props} placeholder="Rechercher l’adresse du dépôt…" />
            )}
          </Field>

          {DISTANCE_FIELDS.map(({ field, label, hint }) => (
            <DistanceField
              key={field}
              label={label}
              hint={hint}
              mode={form.values[`${field}_mode`]}
              value={form.values[field]}
              onModeChange={(mode) => form.setValues((values) => ({ ...values, [`${field}_mode`]: mode }))}
              onChange={(value) => form.setValues((values) => ({ ...values, [field]: value }))}
              error={form.errors[field]}
              effective={municipality[`effective_${field}`]}
            />
          ))}

          <div className="flex justify-end">
            <Button type="submit" loading={form.submitting} disabled={!dirty}>
              Enregistrer les règles
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Zone de prise en charge">
        <PickupZoneMap point={point} radiusKm={pickupKm} />
      </Panel>
    </div>
  )
}
