import { updateMunicipality } from '../../api/municipalities'
import { useForm } from '../../hooks/useForm'
import { onCallChanges, onCallFormValues } from '../../lib/municipalities'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Panel } from '../ui/Panel'

// Contact de garde de la commune active (facultatif, réglé par un admin) : il reçoit par email les demandes d'aide des
// chauffeurs, en plus des agents et admins. Il n'a pas besoin de compte. Champs vides : personne d'autre n'est prévenu.
// Seuls les champs modifiés sont envoyés ; bouton désactivé sans changement. `notice` : message après l'enregistrement,
// masqué dès la modification suivante. `onSaved(municipalité)` après l'enregistrement.
export function OnCallContactPanel({ municipality, notice, onSaved }) {
  const form = useForm(onCallFormValues(municipality))
  const changes = onCallChanges(municipality, form.values)
  const dirty = Object.keys(changes).length > 0

  async function handleSubmit(event) {
    event.preventDefault()
    if (!dirty) return
    const result = await form.submit(() => updateMunicipality(municipality.id, changes))
    if (result.ok) onSaved(result.data)
  }

  return (
    <Panel title="Contact de garde (demandes d’aide des chauffeurs)">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-5">
        <p className="text-sm text-muted">
          Facultatif. Quand un chauffeur appuie sur « Aide », ce contact reçoit l’email avec la carte, en plus des agents
          et des administrateurs. Par exemple : le chef du service technique, ou un numéro de garde.
        </p>
        {notice && !dirty && <Alert tone="success">{notice}</Alert>}
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
          <Button type="submit" loading={form.submitting} disabled={!dirty}>
            Enregistrer le contact de garde
          </Button>
        </div>
      </form>
    </Panel>
  )
}
