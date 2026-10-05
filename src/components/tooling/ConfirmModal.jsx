import { useState } from 'react'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation d'une action des outils (suppression, relance groupée). `action()` renvoie le résultat passé à
// `onDone` ; l'erreur s'affiche dans la fenêtre. `children` : explication ; `danger` : bouton rouge.
export function ConfirmModal({ open, title, confirmLabel, danger = false, action, onClose, onDone, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {open && (
        <ConfirmForm confirmLabel={confirmLabel} danger={danger} action={action} onClose={onClose} onDone={onDone}>
          {children}
        </ConfirmForm>
      )}
    </Modal>
  )
}

function ConfirmForm({ confirmLabel, danger, action, onClose, onDone, children }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setRunning(true)
    setError(null)
    try {
      onDone(await action())
    } catch (err) {
      setError(getErrorMessage(err))
      setRunning(false)
    }
  }

  return (
    <div className="grid gap-4 text-sm">
      {children}
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} loading={running}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
