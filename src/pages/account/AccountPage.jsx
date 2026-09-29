import { useState } from 'react'
import { updatePassword, updateProfile } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import { NotificationPreferencesCard } from '../../components/notifications/NotificationPreferencesCard'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, PasswordInput } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { useForm } from '../../hooks/useForm'

export function AccountPage() {
  return (
    <>
      <PageHeader eyebrow="Mon compte" title="Mes informations" description="Vos coordonnées, votre mot de passe et vos notifications." />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
        <NotificationPreferencesCard />
      </div>
    </>
  )
}

function ProfileForm() {
  const { user, refresh } = useAuth()
  const [saved, setSaved] = useState(false)
  const form = useForm({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone ?? '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    const result = await form.submit((values) => updateProfile(user.id, values))
    if (result.ok) {
      setSaved(true)
      await refresh() // met à jour le nom affiché dans l'en-tête
    }
  }

  return (
    <Card as="section" aria-labelledby="profile-title">
      <h2 id="profile-title" className="text-[17px] font-bold">
        Profil
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        {saved && (
          <Alert tone="success" className="sm:col-span-2">
            Vos informations ont été enregistrées.
          </Alert>
        )}
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

        <div className="sm:col-span-2">
          <Button type="submit" loading={form.submitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}

const EMPTY_PASSWORDS = { current_password: '', password: '', password_confirmation: '' }

function PasswordForm() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const form = useForm(EMPTY_PASSWORDS)

  // La session en cours reste valide ; le backend ferme les sessions des autres appareils
  async function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    const result = await form.submit((values) => updatePassword(user.id, values))
    if (result.ok) {
      form.setValues(EMPTY_PASSWORDS)
      setSaved(true)
    }
  }

  return (
    <Card as="section" aria-labelledby="password-title">
      <h2 id="password-title" className="text-[17px] font-bold">
        Mot de passe
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4">
        <p className="text-sm text-muted">Vos autres appareils seront déconnectés ; cette session reste ouverte.</p>
        {saved && <Alert tone="success">Votre mot de passe a été modifié.</Alert>}
        {form.error && <Alert tone="danger">{form.error}</Alert>}

        <Field label="Mot de passe actuel" required error={form.errors.current_password}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="current-password"
              value={form.values.current_password}
              onChange={form.handle('current_password')}
            />
          )}
        </Field>
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

        <div>
          <Button type="submit" loading={form.submitting}>
            Modifier le mot de passe
          </Button>
        </div>
      </form>
    </Card>
  )
}
