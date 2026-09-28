import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { getHomePath } from '../../auth/permissions'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox, Field, Input } from '../../components/ui/Field'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'

export function LoginPage() {
  const { login, sessionNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      const user = await login(form)
      // Retour à la page demandée avant la connexion, sinon à l'espace du rôle
      navigate(location.state?.from?.pathname ?? getHomePath(user), { replace: true })
    } catch (err) {
      const errors = getFieldErrors(err)
      setFieldErrors(errors)
      if (Object.keys(errors).length === 0) setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-7">
      <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">Connexion</p>
      <h1 className="mt-2 text-[27px] leading-tight font-bold tracking-tight">Bienvenue</h1>
      <p className="mt-1 text-muted">Connectez-vous pour réserver ou suivre vos déplacements.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4">
        {sessionNotice && <Alert tone="warning">{sessionNotice}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}

        <Field label="Adresse e-mail" required error={fieldErrors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
            />
          )}
        </Field>

        <Field label="Mot de passe" required error={fieldErrors.password}>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
            />
          )}
        </Field>

        <Checkbox
          label="Rester connecté"
          checked={form.remember}
          onChange={(event) => update('remember', event.target.checked)}
        />

        <Button type="submit" loading={submitting} className="w-full">
          Se connecter
        </Button>
      </form>
    </Card>
  )
}
