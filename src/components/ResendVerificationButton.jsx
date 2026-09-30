import { useState } from 'react'
import { resendVerificationEmail } from '../api/auth'
import { getErrorMessage } from '../lib/errors'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'

// Renvoie l'email de vérification (utilisateur connecté, 6 envois par minute au maximum)
export function ResendVerificationButton({ variant = 'primary' }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  async function handleClick() {
    setSending(true)
    try {
      // L'email part en arrière-plan : il peut arriver quelques secondes après la réponse
      const message = await resendVerificationEmail()
      setResult({ tone: 'success', message: `${message} Il peut mettre quelques instants à arriver.` })
    } catch (error) {
      setResult({ tone: 'danger', message: getErrorMessage(error) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid w-full justify-items-center gap-3">
      <Button variant={variant} loading={sending} onClick={handleClick}>
        Renvoyer l’e-mail de vérification
      </Button>
      {result && (
        <Alert tone={result.tone} className="w-full text-left">
          {result.message}
        </Alert>
      )}
    </div>
  )
}
