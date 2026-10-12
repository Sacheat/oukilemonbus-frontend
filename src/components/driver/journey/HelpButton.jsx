import { LifeBuoy } from 'lucide-react'
import { useState } from 'react'
import { createDriverAlert } from '../../../api/driverAlerts'
import { readDevicePosition } from '../../../lib/devicePosition'
import { getErrorMessage } from '../../../lib/errors'
import { withSensitiveHint } from '../../../lib/privacy'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Field, Textarea } from '../../ui/Field'
import { Modal } from '../../ui/Modal'

// Bouton « Aide » (panne, accident, problème à bord) : en deux gestes, « Aide » puis « Envoyer ».
// La position du téléphone part avec l'alerte ; sans elle, le backend indique le dernier lieu connu du trajet.
// Les agents, les admins et le contact de garde de la commune sont prévenus tout de suite.
// `mission` : trajet concerné (facultatif) ; `onSent(alert)` après l'envoi.
export function HelpButton({ mission = null, onSent, className }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} className={className}>
        <LifeBuoy className="size-5" aria-hidden="true" />
        Aide
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Demander de l’aide">
        {open && (
          <HelpForm
            mission={mission}
            onCancel={() => setOpen(false)}
            onSent={(alert) => {
              setOpen(false)
              onSent?.(alert)
            }}
          />
        )}
      </Modal>
    </>
  )
}

// Contenu monté à l'ouverture : une clé anti-doublon par demande (réutilisée si l'envoi est relancé)
function HelpForm({ mission, onCancel, onSent }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const position = await readDevicePosition()
      onSent(await createDriverAlert({ reservationId: mission?.id, message, position }, idempotencyKey))
    } catch (err) {
      setError(getErrorMessage(err))
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="text-sm">
        Les agents sont prévenus immédiatement, avec votre position.
        {mission && ` Trajet : ${mission.organization?.name ?? `n° ${mission.id}`}.`}
      </p>
      <Field label="Que se passe-t-il ?" hint={withSensitiveHint('Facultatif. Par exemple : pneu crevé, accident, route barrée.')}>
        {(props) => <Textarea {...props} rows={3} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} />}
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="danger" loading={sending}>
          Envoyer la demande d’aide
        </Button>
      </div>
    </form>
  )
}
