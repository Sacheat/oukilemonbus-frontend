import { updateProfile } from '../../api/users'
import { useForm } from '../../hooks/useForm'
import { changedUserFields, userFormValues } from '../../lib/users'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'

// Informations d'un compte (nom, email, téléphone) ; seuls les champs modifiés sont envoyés.
// Les erreurs 422 (email déjà utilisé…) s'affichent sous le champ concerné.
export function UserInfoForm({ user, onSaved }) {
  const form = useForm(userFormValues(user))

  async function save(values) {
    const changes = changedUserFields(user, values)
    if (Object.keys(changes).length === 0) return null // rien n'a changé : pas de requête
    return updateProfile(user.id, { ...userFormValues(user), ...changes })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(save)
    if (result.ok) onSaved(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" error={form.errors.first_name} required>
          {(props) => (
            <Input {...props} value={form.values.first_name} onChange={form.handle('first_name')} maxLength={100} autoComplete="off" />
          )}
        </Field>
        <Field label="Nom" error={form.errors.last_name} required>
          {(props) => (
            <Input {...props} value={form.values.last_name} onChange={form.handle('last_name')} maxLength={255} autoComplete="off" />
          )}
        </Field>
      </div>
      <Field label="Email" error={form.errors.email} required>
        {(props) => (
          <Input {...props} type="email" value={form.values.email} onChange={form.handle('email')} maxLength={255} autoComplete="off" />
        )}
      </Field>
      <Field label="Téléphone" error={form.errors.phone}>
        {(props) => <Input {...props} type="tel" value={form.values.phone} onChange={form.handle('phone')} maxLength={20} autoComplete="off" />}
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" loading={form.submitting}>
          Enregistrer les informations
        </Button>
      </div>
    </form>
  )
}
