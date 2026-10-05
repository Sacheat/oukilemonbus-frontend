import { useState } from 'react'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Field } from '../../ui/Field'
import { Modal } from '../../ui/Modal'
import { NumberStepper } from '../../ui/NumberStepper'

// Dernière arrivée (retour au lieu de départ) : le chauffeur confirme les passagers transportés, pré-remplis avec le
// prévu. L'enregistrement crée le compte rendu « réalisé » avec les heures réelles des boutons.
export function FinalArrivalModal({ open, mission, sending, error, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title="Fin de la mission">
      {open && <PassengersForm mission={mission} sending={sending} error={error} onClose={onClose} onConfirm={onConfirm} />}
    </Modal>
  )
}

// Contenu monté à l'ouverture : on repart toujours des passagers prévus
function PassengersForm({ mission, sending, error, onClose, onConfirm }) {
  const [children, setChildren] = useState(String(mission.nb_children))
  const [adults, setAdults] = useState(String(mission.nb_adults))

  function handleSubmit(event) {
    event.preventDefault()
    onConfirm({ actual_nb_children: Number(children), actual_nb_adults: Number(adults) })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="text-sm text-muted">
        Combien de personnes avez-vous transportées ? Le compte rendu du trajet sera enregistré avec les heures de vos
        boutons.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Enfants transportés" required>
          {(props) => (
            <NumberStepper {...props} value={children} onChange={setChildren} decrementLabel="Un enfant de moins" incrementLabel="Un enfant de plus" />
          )}
        </Field>
        <Field label="Adultes transportés" required>
          {(props) => (
            <NumberStepper {...props} value={adults} onChange={setAdults} decrementLabel="Un adulte de moins" incrementLabel="Un adulte de plus" />
          )}
        </Field>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" variant="accent" loading={sending}>
          Confirmer l’arrivée
        </Button>
      </div>
    </form>
  )
}
