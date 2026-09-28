import { Link, useLocation, useNavigate } from 'react-router'
import { getHomePath } from '../../auth/permissions'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Checkbox, Field, Input, PasswordInput } from '../../components/ui/Field'
import { useForm } from '../../hooks/useForm'
import { AuthCard } from './AuthCard'

export function LoginPage() {
  const { login, sessionNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm({ email: '', password: '', remember: true })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(login)
    if (result.ok) {
      // Retour à la page demandée avant la connexion, sinon à l'espace du rôle
      navigate(location.state?.from?.pathname ?? getHomePath(result.data), { replace: true })
    }
  }

  return (
    <AuthCard
      eyebrow="Connexion"
      title="Bienvenue"
      description="Connectez-vous pour réserver ou suivre vos déplacements."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-bold text-link hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {sessionNotice && <Alert tone={sessionNotice.tone}>{sessionNotice.message}</Alert>}
        {form.error && <Alert tone="danger">{form.error}</Alert>}

        <Field label="Adresse e-mail" required error={form.errors.email}>
          {(props) => (
            <Input {...props} type="email" autoComplete="email" value={form.values.email} onChange={form.handle('email')} />
          )}
        </Field>

        <Field label="Mot de passe" required error={form.errors.password}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="current-password"
              value={form.values.password}
              onChange={form.handle('password')}
            />
          )}
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox label="Rester connecté" checked={form.values.remember} onChange={form.handle('remember')} />
          <Link to="/mot-de-passe-oublie" className="py-2 text-sm font-bold text-link hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" loading={form.submitting} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  )
}
