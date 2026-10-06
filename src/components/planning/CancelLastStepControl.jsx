import { Undo2 } from 'lucide-react'
import { useState } from 'react'
import { cancelLastTripEvent } from '../../api/tripProgress'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// « Annuler la dernière étape » (agent) : efface une étape appuyée par erreur, par exemple un « Départ » trop tôt, pour
// que le chauffeur réappuie au bon moment. Confirmé dans une fenêtre ; le backend refuse une fois le compte rendu créé
// (on corrige alors le compte rendu). `lastEvent` : dernière étape enregistrée ; `onCancelled(étape)` après l'annulation.
export function CancelLastStepControl({ reservationId, lastEvent, onCancelled }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-fit">
        <Undo2 className="size-4" aria-hidden="true" />
        Annuler la dernière étape
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Annuler la dernière étape">
        {open && (
          <ConfirmCancel
            reservationId={reservationId}
            lastEvent={lastEvent}
            onClose={() => setOpen(false)}
            onCancelled={(event) => {
              setOpen(false)
              onCancelled(event)
            }}
          />
        )}
      </Modal>
    </>
  )
}

// Contenu monté à l'ouverture : pas d'erreur d'un essai précédent
function ConfirmCancel({ reservationId, lastEvent, onClose, onCancelled }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setSending(true)
    setError(null)
    try {
      const result = await cancelLastTripEvent(reservationId)
      onCancelled(result.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setSending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p>
        Annuler « <strong>{lastEvent.type_label}</strong> » enregistré à <strong className="tabular-nums">{lastEvent.local_time}</strong> ?
      </p>
      <p className="text-sm text-muted">
        À utiliser quand le chauffeur a appuyé par erreur. L’étape est effacée (l’historique garde qui l’a annulée) et le
        chauffeur pourra appuyer à nouveau au bon moment.
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Garder l’étape
        </Button>
        <Button variant="danger" loading={sending} onClick={handleConfirm}>
          Annuler l’étape
        </Button>
      </div>
    </div>
  )
}
