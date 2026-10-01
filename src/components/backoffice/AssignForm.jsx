import { useCallback, useState } from 'react'
import { getReservationAvailability } from '../../api/planning'
import { assignReservation } from '../../api/reservations'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/ErrorState'
import { Field, Input, Select } from '../ui/Field'
import { Skeleton } from '../ui/Skeleton'

// Affectation manuelle : chauffeur et véhicule libres sur le créneau de la réservation (planning avec
// disponibilités), les autres affichés grisés avec leur raison. Le backend revérifie tout à l'envoi.
// La clé d'idempotence est créée à l'ouverture du formulaire.
export function AssignForm({ reservation, onDone, onCancel }) {
  const fetchAvailability = useCallback((signal) => getReservationAvailability(reservation, { signal }), [reservation])
  const availability = useApi(fetchAvailability)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const form = useForm({
    driver_id: reservation.driver_id ? String(reservation.driver_id) : '',
    vehicle_id: reservation.vehicle_id ? String(reservation.vehicle_id) : '',
    reason: '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) => assignReservation(reservation.id, values, idempotencyKey))
    if (result.ok) onDone(result.data)
  }

  if (availability.error) return <ErrorState error={availability.error} onRetry={availability.reload} />
  if (availability.loading && !availability.data) {
    return (
      <div role="status" className="grid gap-3">
        <span className="sr-only">Chargement des disponibilités…</span>
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    )
  }
  if (!availability.data) {
    return <Alert tone="warning">Les disponibilités de ce créneau n’ont pas pu être calculées.</Alert>
  }

  const { drivers, vehicles } = availability.data
  const unchanged =
    form.values.driver_id === String(reservation.driver_id ?? '') && form.values.vehicle_id === String(reservation.vehicle_id ?? '')

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field label="Chauffeur" hint={`${drivers.available.length} libre${drivers.available.length > 1 ? 's' : ''} sur ce créneau.`} error={form.errors.driver_id}>
        {(props) => (
          <Select {...props} value={form.values.driver_id} onChange={form.handle('driver_id')}>
            <option value="">Aucun</option>
            <optgroup label="Libres">
              {drivers.available.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </optgroup>
            {drivers.unavailable.length > 0 && (
              <optgroup label="Indisponibles">
                {drivers.unavailable.map((driver) => (
                  <option key={driver.id} value={driver.id} disabled={String(driver.id) !== String(reservation.driver_id)}>
                    {driver.name} ({driver.unavailable_reason})
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        )}
      </Field>
      <Field
        label="Véhicule"
        hint={`${vehicles.available.length} libre${vehicles.available.length > 1 ? 's' : ''}, capacité vérifiée.`}
        error={form.errors.vehicle_id}
      >
        {(props) => (
          <Select {...props} value={form.values.vehicle_id} onChange={form.handle('vehicle_id')}>
            <option value="">Aucun</option>
            <optgroup label="Libres">
              {vehicles.available.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licence_plate} · {vehicle.capacity} places
                </option>
              ))}
            </optgroup>
            {vehicles.unavailable.length > 0 && (
              <optgroup label="Indisponibles">
                {vehicles.unavailable.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id} disabled={String(vehicle.id) !== String(reservation.vehicle_id)}>
                    {vehicle.licence_plate} ({vehicle.unavailable_reason})
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        )}
      </Field>
      <Field label="Remarque" hint="Facultatif. Gardée dans l’historique de la réservation, non envoyée au demandeur." error={form.errors.reason}>
        {(props) => <Input {...props} maxLength={500} value={form.values.reason} onChange={form.handle('reason')} />}
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Retour
        </Button>
        <Button type="submit" loading={form.submitting} disabled={unchanged}>
          Affecter
        </Button>
      </div>
    </form>
  )
}
