import { createMunicipality } from '../../api/municipalities'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Ajout d'une commune (inactive) : elle se règle et s'active ensuite. Une synchronisation GeoNames après
// l'activation remplit ses localités et son centre.
export function MunicipalityCreateModal({ open, onClose, onCreated }) {
  return (
    <Modal open={open} onClose={onClose} title="Ajouter une commune">
      {open && <CreateForm onClose={onClose} onCreated={onCreated} />}
    </Modal>
  )
}

function CreateForm({ onClose, onCreated }) {
  const form = useForm({ name: '', postal_code: '', nis_code: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) => createMunicipality({ ...values, is_active: false }))
    if (result.ok) onCreated(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field label="Nom" hint="Tel qu’il est connu de GeoNames, pour la synchronisation des localités." error={form.errors.name} required>
        {(props) => <Input {...props} value={form.values.name} onChange={form.handle('name')} maxLength={100} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code postal" error={form.errors.postal_code}>
          {(props) => <Input {...props} value={form.values.postal_code} onChange={form.handle('postal_code')} maxLength={20} />}
        </Field>
        <Field label="Code INS" error={form.errors.nis_code}>
          {(props) => <Input {...props} value={form.values.nis_code} onChange={form.handle('nis_code')} maxLength={20} />}
        </Field>
      </div>
      <p className="text-sm text-muted">La commune est créée inactive : rien ne change pour les réservations tant que vous ne l’activez pas.</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button type="submit" loading={form.submitting}>
          Ajouter la commune
        </Button>
      </div>
    </form>
  )
}
