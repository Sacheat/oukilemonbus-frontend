import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { sendPasswordResetLink } from '../../api/users'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'

// Section « Mot de passe » : envoie à la personne un lien de réinitialisation par email (l'admin ne voit ni ne fixe
// aucun mot de passe). Pas pour son propre compte (changement depuis /compte) ni pour un compte désactivé.
export function UserPasswordControl({ user, self }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null) // { tone, message }

  if (self) return null

  async function handleSend() {
    setSending(true)
    setResult(null)
    try {
      setResult({ tone: 'success', message: await sendPasswordResetLink(user.id) })
    } catch (err) {
      setResult({ tone: 'danger', message: getErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Mot de passe</h3>
      {result && <Alert tone={result.tone}>{result.message}</Alert>}
      {user.active ? (
        <>
          <p className="text-sm text-muted">
            La personne reçoit par email un lien pour choisir un nouveau mot de passe, valable 60 minutes.
          </p>
          <div>
            <Button variant="secondary" onClick={handleSend} loading={sending}>
              <KeyRound className="size-4" aria-hidden="true" /> Envoyer un lien de réinitialisation
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Réactivez le compte avant d’envoyer un lien de réinitialisation.</p>
      )}
    </section>
  )
}
