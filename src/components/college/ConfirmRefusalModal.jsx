import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

// Confirmation avant d'enregistrer un refus du Collège : la suite est automatique et définitive
export function ConfirmRefusalModal({ open, reservation, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enregistrer un refus du Collège"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Retour
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirmer le refus
          </Button>
        </>
      }
    >
      {open && (
        <div className="grid gap-2 text-sm">
          <p>En enregistrant ce refus :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              la réservation n° {reservation.id} de <strong>{reservation.organization?.name}</strong> sera{' '}
              <strong>refusée automatiquement</strong>, avec les notes comme motif ;
            </li>
            <li>la délibération sera générée en PDF ;</li>
            <li>le demandeur sera prévenu.</li>
          </ul>
          <p className="font-semibold">Une réservation refusée ne peut plus être rouverte.</p>
        </div>
      )}
    </Modal>
  )
}
