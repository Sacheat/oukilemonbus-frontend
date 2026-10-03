import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { resetPassword } from '../../api/auth'
import { getHomePath } from '../../auth/permissions'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, PasswordInput } from '../../components/ui/Field'
import { useForm } from '../../hooks/useForm'
import { AuthCard } from './AuthCard'

// Ouverte depuis le lien de l'email : {FRONTEND_URL}/reset-password?token=…&email=…, connecté ou non.
// Une session ouverte sur un autre compte (ex. un admin qui teste le lien qu'il a envoyé) est annoncée et reste
// ouverte ; si c'est le compte du lien, le backend ferme ses sessions : retour à la connexion.
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const { user, clearSession } = useAuth()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const form = useForm({ email: email ?? '', password: '', password_confirmation: '' })
  const [doneMessage, setDoneMessage] = useState(null)
  const otherAccount = Boolean(user && email && user.email.toLowerCase() !== email.toLowerCase())

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) => resetPassword({ ...values, token }))
    if (!result.ok) return
    if (otherAccount) {
      setDoneMessage(result.data)
      return
    }
    // Le backend ferme toutes les sessions du compte
    await clearSession({ tone: 'success', message: result.data })
    navigate('/connexion', { replace: true })
  }

  const footer = (
    <Link to="/connexion" className="font-bold text-link hover:underline">
      Retour à la connexion
    </Link>
  )

  if (!token || !email) {
    return (
      <AuthCard eyebrow="Mot de passe oublié" title="Lien incomplet" footer={footer}>
        <Alert tone="danger">
          Ce lien de réinitialisation est incomplet. Ouvrez à nouveau le lien reçu par e-mail ou{' '}
          <Link to="/mot-de-passe-oublie" className="font-bold underline">
            faites une nouvelle demande
          </Link>
          .
        </Alert>
      </AuthCard>
    )
  }

  if (doneMessage) {
    return (
      <AuthCard eyebrow="Mot de passe oublié" title="Mot de passe changé">
        <Alert tone="success">{doneMessage}</Alert>
        <Button to={getHomePath(user)} className="mt-4 w-full">
          Retour à mon espace
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="Mot de passe oublié"
      title="Choisir un nouveau mot de passe"
      description={
        otherAccount
          ? 'Ce compte sera déconnecté de tous ses appareils après le changement.'
          : 'Vous serez déconnecté de tous vos appareils après le changement.'
      }
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {user && (
          <Alert tone="info">
            {otherAccount
              ? `Vous êtes connecté en tant que ${user.email}. Ce lien change le mot de passe de ${email} ; votre session reste ouverte.`
              : 'Vous êtes connecté avec ce compte : après le changement, il faudra vous reconnecter.'}
          </Alert>
        )}
        {form.error && <Alert tone="danger">{form.error}</Alert>}

        <Field label="Adresse e-mail" error={form.errors.email}>
          {(props) => <Input {...props} type="email" value={form.values.email} readOnly className="bg-surface-muted" />}
        </Field>
        {form.errors.email && (
          <p className="-mt-2 text-sm">
            <Link to="/mot-de-passe-oublie" className="font-bold text-link hover:underline">
              Demander un nouveau lien
            </Link>
          </p>
        )}

        <Field label="Nouveau mot de passe" required hint="8 caractères minimum." error={form.errors.password}>
          {(props) => (
            <PasswordInput {...props} autoComplete="new-password" value={form.values.password} onChange={form.handle('password')} />
          )}
        </Field>

        <Field label="Confirmation" required error={form.errors.password_confirmation}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              value={form.values.password_confirmation}
              onChange={form.handle('password_confirmation')}
            />
          )}
        </Field>

        <Button type="submit" loading={form.submitting} className="w-full">
          Enregistrer le mot de passe
        </Button>
      </form>
    </AuthCard>
  )
}
