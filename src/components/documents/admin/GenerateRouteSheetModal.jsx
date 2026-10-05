import { useApi } from '../../../hooks/useApi'
import { useForm } from '../../../hooks/useForm'
import { generateRouteSheet } from '../../../api/routeSheets'
import { getAllVehicles } from '../../../api/vehicles'
import { routeSheetBody, routeSheetFormValues } from '../../../lib/documentsAdmin'
import { vehicleOptions } from '../../../lib/unavailabilities'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { ChoicePills } from '../../ui/ChoicePills'
import { ErrorState } from '../../ui/ErrorState'
import { Field, Input, Select } from '../../ui/Field'
import { Loader } from '../../ui/Loader'
import { Modal } from '../../ui/Modal'

const MODES = [
  { value: 'jour', label: 'Un jour, un véhicule' },
  { value: 'periode', label: 'Une période' },
]

const fetchVehicles = (signal) => getAllVehicles({ signal })

function RouteSheetForm({ onGenerated }) {
  const vehicles = useApi(fetchVehicles)
  const form = useForm(routeSheetFormValues())
  const { values } = form

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((current) => generateRouteSheet(routeSheetBody(current)))
    if (result.ok) onGenerated(result.data)
  }

  if (vehicles.error) return <ErrorState error={vehicles.error} onRetry={vehicles.reload} />
  if (!vehicles.data) return <Loader />

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      <ChoicePills
        legend="Que générer ?"
        options={MODES}
        value={values.mode}
        onChange={(mode) => form.setValues((current) => ({ ...current, mode }))}
      />

      {values.mode === 'jour' ? (
        <>
          <Field label="Jour" error={form.errors.service_date} required>
            {(props) => <Input {...props} type="date" value={values.service_date} onChange={form.handle('service_date')} />}
          </Field>
          <Field label="Véhicule" error={form.errors.vehicle_id} required>
            {(props) => (
              <Select {...props} value={values.vehicle_id} onChange={form.handle('vehicle_id')}>
                <option value="">Choisir un véhicule</option>
                {vehicleOptions(vehicles.data).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licence_plate}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Du" error={form.errors.start_date} required>
            {(props) => <Input {...props} type="date" value={values.start_date} onChange={form.handle('start_date')} />}
          </Field>
          <Field label="Au" error={form.errors.end_date} required>
            {(props) => <Input {...props} type="date" min={values.start_date} value={values.end_date} onChange={form.handle('end_date')} />}
          </Field>
        </div>
      )}

      <Alert tone="info">
        Les missions confirmées de la période figurent sur la feuille. Si une feuille existe déjà pour ce jour, une
        nouvelle version est créée.
      </Alert>

      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          Générer
        </Button>
      </div>
    </form>
  )
}

// Fenêtre « Générer une feuille de route » : un jour et un véhicule, ou une période (tous les véhicules).
// Contenu monté à l'ouverture seulement (formulaire vide à chaque fois).
export function GenerateRouteSheetModal({ open, onClose, onGenerated }) {
  return (
    <Modal open={open} onClose={onClose} title="Générer une feuille de route">
      <RouteSheetForm onGenerated={onGenerated} />
    </Modal>
  )
}
