import { useState } from 'react'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Action d'un agent avec motif obligatoire (refuser, annuler). `action(reason, idempotencyKey)` renvoie la
// réservation mise à jour, passée à `onDone`. La clé d'idempotence est créée à l'ouverture : un double clic
// ou une relance n'applique l'action qu'une fois.
// `initialReason` : motif proposé (modifiable), ex. après une décision défavorable du Collège.
export function ReasonModal({ open, onClose, title, intro, label, submitLabel, action, onDone, initialReason = '' }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {open && (
        <ReasonForm
          intro={intro}
          label={label}
          submitLabel={submitLabel}
          action={action}
          onClose={onClose}
          onDone={onDone}
          initialReason={initialReason}
        />
      )}
    </Modal>
  )
}

function ReasonForm({ intro, label, submitLabel, action, onClose, onDone, initialReason }) {
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const form = useForm({ reason: initialReason })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(({ reason }) => action(reason, idempotencyKey))
    if (result.ok) onDone(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {intro && <p className="text-sm text-muted">{intro}</p>}
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field label={label} required error={form.errors.reason}>
        {(props) => (
          <Textarea {...props} autoFocus maxLength={1000} value={form.values.reason} onChange={form.handle('reason')} />
        )}
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button type="submit" variant="danger" loading={form.submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
