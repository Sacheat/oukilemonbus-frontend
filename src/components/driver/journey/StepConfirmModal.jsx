import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'

// Confirmation d'une étape avant l'envoi (erreur humaine, décidé avec Sacha le 06/10) : un appui par erreur sur
// « Départ » ou « Arrivée » ne part pas tout de suite. Gros boutons pour le téléphone sur support.
// `step` : { label, leg } ou null (fenêtre fermée).
export function StepConfirmModal({ step, onCancel, onConfirm }) {
  return (
    <Modal open={Boolean(step)} onClose={onCancel} title={step ? `${step.label} (${step.leg.toLowerCase()})` : ''}>
      {step && (
        <div className="grid gap-4">
          <p>
            Confirmer « <strong>{step.label}</strong> » maintenant ? L’heure enregistrée sera celle de cette confirmation.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onCancel} className="min-h-14 text-lg">
              Pas encore
            </Button>
            <Button variant="primary" onClick={onConfirm} className="min-h-14 text-lg font-extrabold">
              Oui, confirmer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
