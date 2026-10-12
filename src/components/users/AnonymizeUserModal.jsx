import { useState } from 'react'
import { anonymizeUser } from '../../api/users'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Confirmation avant d'anonymiser un compte (RGPD, irréversible) : case « Je comprends » obligatoire.
// Refus du backend (réservation ou mission à venir, demande d'aide ouverte, dernier admin) : une ligne par raison.
export function AnonymizeUserModal({ user, open, onClose, onAnonymized }) {
  return (
    <Modal open={open} onClose={onClose} title="Anonymiser le compte">
      {open && <AnonymizeForm user={user} onClose={onClose} onAnonymized={onAnonymized} />}
    </Modal>
  )
}

function AnonymizeForm({ user, onClose, onAnonymized }) {
  const [understood, setUnderstood] = useState(false)
  const [sending, setSending] = useState(false)
  const [reasons, setReasons] = useState(null) // { message, lines }

  async function handleAnonymize() {
    setSending(true)
    setReasons(null)
    try {
      onAnonymized(await anonymizeUser(user.id))
    } catch (err) {
      const lines = getFieldErrors(err).user?.split('\n') ?? []
      setReasons({ message: lines.length > 0 ? 'Le compte ne peut pas encore être anonymisé :' : getErrorMessage(err), lines })
      setSending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        Le nom, l’email et le téléphone de <strong>{user.full_name}</strong> sont effacés, ses accès, rôles et
        appartenances retirés, ses notifications supprimées. Ses réservations, comptes rendus et documents officiels
        restent (obligation de conservation) et afficheront « Utilisateur supprimé ».
      </p>
      <p className="text-sm text-muted">
        Pensez à exporter ses données d’abord si la personne les a demandées. Les coordonnées de contact d’une
        organisation ne sont pas touchées : corrigez-les dans Organisations si besoin.
      </p>
      {reasons && (
        <Alert tone="danger">
          <p>{reasons.message}</p>
          {reasons.lines.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {reasons.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      <Checkbox
        checked={understood}
        onChange={(event) => setUnderstood(event.target.checked)}
        label="Je comprends que l’anonymisation est définitive : le compte ne pourra plus être réactivé."
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handleAnonymize} loading={sending} disabled={!understood}>
          Anonymiser
        </Button>
      </div>
    </div>
  )
}
