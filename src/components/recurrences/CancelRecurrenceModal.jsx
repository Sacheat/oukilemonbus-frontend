import { cancelRecurrence } from '../../api/recurrences'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Annulation de la série avec motif obligatoire : le backend annule les trajets à venir
// (ni refusés ni annulés), laisse les trajets passés tels quels et arrête la série.
export function CancelRecurrenceModal({ recurrence, activeCount, open, onClose, onCancelled }) {
  return (
    <Modal open={open} onClose={onClose} title="Annuler la série">
      {open && <CancelForm recurrence={recurrence} activeCount={activeCount} onClose={onClose} onCancelled={onCancelled} />}
    </Modal>
  )
}

function CancelForm({ recurrence, activeCount, onClose, onCancelled }) {
  const form = useForm({ reason: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(({ reason }) => cancelRecurrence(recurrence.id, reason))
    if (result.ok) onCancelled(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <p className="text-sm text-muted">
        {activeCount > 1 ? `Les ${activeCount} trajets à venir seront annulés` : 'Le trajet à venir sera annulé'} et la série
        sera arrêtée. Les trajets passés ne changent pas. Cette action est définitive.
      </p>
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field label="Motif de l’annulation" required error={form.errors.reason}>
        {(props) => <Textarea {...props} maxLength={500} value={form.values.reason} onChange={form.handle('reason')} />}
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button type="submit" variant="danger" loading={form.submitting}>
          Annuler la série
        </Button>
      </div>
    </form>
  )
}
