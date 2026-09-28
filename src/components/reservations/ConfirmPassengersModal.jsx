import { confirmPassengers } from '../../api/reservations'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Nombre définitif de passagers (un rappel est envoyé chaque jour tant que ce n'est pas fait)
export function ConfirmPassengersModal({ reservation, open, onClose, onConfirmed }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmer les passagers">
      {open && <PassengersForm reservation={reservation} onClose={onClose} onConfirmed={onConfirmed} />}
    </Modal>
  )
}

function PassengersForm({ reservation, onClose, onConfirmed }) {
  const form = useForm({
    nb_children: String(reservation.nb_children),
    nb_adults: String(reservation.nb_adults),
    trip_purpose: reservation.trip_purpose,
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) => confirmPassengers(reservation.id, values))
    if (result.ok) onConfirmed(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <p className="text-sm text-muted sm:col-span-2">
        Indiquez le nombre définitif de passagers. Si le véhicule prévu devient trop petit, la commune en sera
        avertie.
      </p>
      {form.error && (
        <Alert tone="danger" className="sm:col-span-2">
          {form.error}
        </Alert>
      )}
      <Field label="Enfants" required error={form.errors.nb_children}>
        {(props) => (
          <Input {...props} type="number" min={0} inputMode="numeric" value={form.values.nb_children} onChange={form.handle('nb_children')} />
        )}
      </Field>
      <Field label="Adultes" required hint="Au moins un adulte accompagnant." error={form.errors.nb_adults}>
        {(props) => (
          <Input {...props} type="number" min={1} inputMode="numeric" value={form.values.nb_adults} onChange={form.handle('nb_adults')} />
        )}
      </Field>
      <Field label="Motif du déplacement" error={form.errors.trip_purpose} className="sm:col-span-2">
        {(props) => <Textarea {...props} maxLength={500} value={form.values.trip_purpose} onChange={form.handle('trip_purpose')} />}
      </Field>
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button type="submit" loading={form.submitting}>
          Confirmer
        </Button>
      </div>
    </form>
  )
}
