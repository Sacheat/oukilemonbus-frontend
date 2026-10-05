import { updateMunicipality } from '../../api/municipalities'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Panel } from '../ui/Panel'

// Contact de garde de la commune active (facultatif, réglé par un admin) : il reçoit par email les demandes d'aide des
// chauffeurs, en plus des agents et admins. Il n'a pas besoin de compte. Champs vides : personne d'autre n'est prévenu.
// `onSaved(municipalité)` après l'enregistrement.
export function OnCallContactPanel({ municipality, onSaved }) {
  const form = useForm({
    on_call_name: municipality.on_call_name ?? '',
    on_call_email: municipality.on_call_email ?? '',
    on_call_phone: municipality.on_call_phone ?? '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) =>
      updateMunicipality(municipality.id, {
        on_call_name: values.on_call_name.trim() || null,
        on_call_email: values.on_call_email.trim() || null,
        on_call_phone: values.on_call_phone.trim() || null,
      }),
    )
    if (result.ok) onSaved(result.data)
  }

  return (
    <Panel title="Contact de garde (demandes d’aide des chauffeurs)">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-5">
        <p className="text-sm text-muted">
          Facultatif. Quand un chauffeur appuie sur « Aide », ce contact reçoit l’email avec la carte, en plus des agents
          et des administrateurs. Par exemple : le chef du service technique, ou un numéro de garde.
        </p>
        {form.error && <Alert tone="danger">{form.error}</Alert>}
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nom" error={form.errors.on_call_name}>
            {(props) => <Input {...props} value={form.values.on_call_name} onChange={form.handle('on_call_name')} maxLength={150} />}
          </Field>
          <Field label="Email" error={form.errors.on_call_email}>
            {(props) => (
              <Input {...props} type="email" value={form.values.on_call_email} onChange={form.handle('on_call_email')} maxLength={255} />
            )}
          </Field>
          <Field label="Téléphone" error={form.errors.on_call_phone}>
            {(props) => <Input {...props} type="tel" value={form.values.on_call_phone} onChange={form.handle('on_call_phone')} maxLength={30} />}
          </Field>
        </div>
        <div>
          <Button type="submit" loading={form.submitting}>
            Enregistrer le contact de garde
          </Button>
        </div>
      </form>
    </Panel>
  )
}
