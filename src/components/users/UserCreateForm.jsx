import { Check, Copy, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { createUser } from '../../api/users'
import { useForm } from '../../hooks/useForm'
import { generatePassword, newUserFormValues } from '../../lib/users'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, PasswordInput } from '../ui/Field'

// Création d'un compte par l'admin, avec un mot de passe provisoire à transmettre à la personne.
// Le compte reçoit le rôle « Utilisateur » ; ses rôles s'ajustent ensuite dans le panneau du compte.
// Le mot de passe est saisi une fois (bouton pour l'afficher) : la confirmation envoyée est la même valeur.
export function UserCreateForm({ onCreated }) {
  const form = useForm(newUserFormValues())
  const [copied, setCopied] = useState(false)

  function fillPassword() {
    const password = generatePassword()
    form.setValues((values) => ({ ...values, password }))
    setCopied(false)
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(form.values.password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) => createUser({ ...values, password_confirmation: values.password }))
    if (result.ok) onCreated(result.data)
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

      <Field
        label="Mot de passe provisoire"
        hint="12 caractères au moins, avec des lettres et des chiffres (« Générer » le fait). Transmettez-le à la personne : il ne sera plus affiché après la création."
        error={form.errors.password}
        required
      >
        {(props) => (
          <PasswordInput {...props} value={form.values.password} onChange={form.handle('password')} autoComplete="new-password" />
        )}
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={fillPassword}>
          <KeyRound className="size-4" aria-hidden="true" /> Générer
        </Button>
        <Button variant="secondary" onClick={copyPassword} disabled={!form.values.password}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? 'Copié' : 'Copier'}
        </Button>
      </div>

      <Alert tone="info">
        Le compte est créé avec le rôle Utilisateur, que vous pourrez changer ensuite. La personne reçoit un email pour
        vérifier son adresse avant sa première connexion.
      </Alert>

      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          Créer le compte
        </Button>
      </div>
    </form>
  )
}
