import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, PasswordInput } from '../../components/ui/Field'
import { useForm } from '../../hooks/useForm'
import { AuthCard } from './AuthCard'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const form = useForm({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(register)
    // Session ouverte, email non vérifié : la racine affiche l'écran « Vérifiez votre adresse »
    if (result.ok) navigate('/', { replace: true })
  }

  return (
    <AuthCard
      eyebrow="Inscription"
      title="Créer un compte"
      description="Une fois inscrit, vous pourrez rejoindre votre organisation et réserver le bus communal."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="font-bold text-link hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {form.error && (
          <Alert tone="danger" className="sm:col-span-2">
            {form.error}
          </Alert>
        )}

        <Field label="Prénom" required error={form.errors.first_name}>
          {(props) => (
            <Input {...props} autoComplete="given-name" value={form.values.first_name} onChange={form.handle('first_name')} />
          )}
        </Field>

        <Field label="Nom" required error={form.errors.last_name}>
          {(props) => (
            <Input {...props} autoComplete="family-name" value={form.values.last_name} onChange={form.handle('last_name')} />
          )}
        </Field>

        <Field label="Adresse e-mail" required error={form.errors.email} className="sm:col-span-2">
          {(props) => (
            <Input {...props} type="email" autoComplete="email" value={form.values.email} onChange={form.handle('email')} />
          )}
        </Field>

        <Field label="Téléphone" hint="Facultatif." error={form.errors.phone} className="sm:col-span-2">
          {(props) => <Input {...props} type="tel" autoComplete="tel" value={form.values.phone} onChange={form.handle('phone')} />}
        </Field>

        <Field label="Mot de passe" required hint="8 caractères minimum." error={form.errors.password}>
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

        <Button type="submit" loading={form.submitting} className="w-full sm:col-span-2">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  )
}
