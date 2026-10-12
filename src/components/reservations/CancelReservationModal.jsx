import { useState } from 'react'
import { cancelReservation } from '../../api/reservations'
import { useForm } from '../../hooks/useForm'
import { SENSITIVE_TEXT_HINT } from '../../lib/privacy'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Annulation avec motif obligatoire. La clé d'idempotence est créée à l'ouverture :
// un double clic ou une relance après coupure réseau n'annule qu'une fois.
export function CancelReservationModal({ reservation, open, onClose, onCancelled }) {
  return (
    <Modal open={open} onClose={onClose} title="Annuler la réservation">
      {open && <CancelForm reservation={reservation} onClose={onClose} onCancelled={onCancelled} />}
    </Modal>
  )
}

function CancelForm({ reservation, onClose, onCancelled }) {
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const form = useForm({ reason: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(({ reason }) => cancelReservation(reservation.id, reason, idempotencyKey))
    if (result.ok) onCancelled(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <p className="text-sm text-muted">
        L’annulation est définitive. Elle doit intervenir au moins 24 heures avant le départ.
      </p>
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field label="Motif de l’annulation" hint={SENSITIVE_TEXT_HINT} required error={form.errors.reason}>
        {(props) => <Textarea {...props} maxLength={1000} value={form.values.reason} onChange={form.handle('reason')} />}
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button type="submit" variant="danger" loading={form.submitting}>
          Annuler la réservation
        </Button>
      </div>
    </form>
  )
}
