import { useState } from 'react'
import { Link } from 'react-router'
import { forgotPassword } from '../../api/auth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useForm } from '../../hooks/useForm'
import { AuthCard } from './AuthCard'

export function ForgotPasswordPage() {
  const form = useForm({ email: '' })
  const [sentMessage, setSentMessage] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(({ email }) => forgotPassword(email))
    if (result.ok) setSentMessage(result.data)
  }

  return (
    <AuthCard
      eyebrow="Mot de passe oublié"
      title="Réinitialiser le mot de passe"
      description="Indiquez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe."
      footer={
        <Link to="/connexion" className="font-bold text-link hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sentMessage ? (
        <Alert tone="success" title="Demande envoyée">
          <p>{sentMessage}</p>
          <p className="mt-1">Le lien est valable 60 minutes. Pensez à vérifier vos courriers indésirables.</p>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          {form.error && <Alert tone="danger">{form.error}</Alert>}
          <Field label="Adresse e-mail" required error={form.errors.email}>
            {(props) => (
              <Input {...props} type="email" autoComplete="email" value={form.values.email} onChange={form.handle('email')} />
            )}
          </Field>
          <Button type="submit" loading={form.submitting} className="w-full">
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
