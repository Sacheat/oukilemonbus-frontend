import { useState } from 'react'
import { closeDriverAlert } from '../../api/driverAlerts'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Clôture d'une demande d'aide : ce qui a été fait (obligatoire), gardé dans l'historique de l'alerte.
export function CloseAlertModal({ open, alert, onClose, onClosed }) {
  return (
    <Modal open={open} onClose={onClose} title={`Clôturer la demande d’aide n° ${alert.id}`}>
      {open && <CloseForm alert={alert} onCancel={onClose} onClosed={onClosed} />}
    </Modal>
  )
}

function CloseForm({ alert, onCancel, onClosed }) {
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [fieldError, setFieldError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setError(null)
    setFieldError(null)
    try {
      onClosed(await closeDriverAlert(alert.id, note.trim()))
    } catch (err) {
      const fields = getFieldErrors(err)
      if (fields.closing_note) setFieldError(fields.closing_note)
      else setError(getErrorMessage(err))
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <Field label="Ce qui a été fait" hint="Par exemple : dépanneuse envoyée, bus de remplacement à 11:30, fausse alerte." error={fieldError} required>
        {(props) => <Textarea {...props} rows={4} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />}
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={sending}>
          Clôturer
        </Button>
      </div>
    </form>
  )
}
