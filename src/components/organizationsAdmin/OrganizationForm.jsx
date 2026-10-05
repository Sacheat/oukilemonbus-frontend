import { useState } from 'react'
import { createOrganization, updateOrganization } from '../../api/organizations'
import { useForm } from '../../hooks/useForm'
import { organizationFormValues, organizationPayload, ORGANIZATION_TYPES, typeChangeEffects } from '../../lib/organizationsAdmin'
import { LocationPicker } from '../reservations/LocationPicker'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { NumberStepper } from '../ui/NumberStepper'

// Formulaire d'ajout (sans `organization`) ou de modification : coordonnées, siège social, type, quota annuel.
//   type changé sur une organisation existante → confirmation qui annonce l'effet (Collège, quota, priorité…)
//   modification                              → seuls les champs changés sont envoyés
// `types` : catalogue du backend [{ value, label, rules }] ; le quota est masqué pour un type exempté.
export function OrganizationForm({ organization = null, types = [], onSaved, onCancel }) {
  const form = useForm(organizationFormValues(organization))
  const [location, setLocation] = useState(organization?.location ?? null)
  const [confirmingType, setConfirmingType] = useState(false)
  const isEditing = Boolean(organization)

  const rulesOf = (type) => types.find((item) => item.value === type)?.rules
  const selectedRules = rulesOf(form.values.type)
  const typeChanged = isEditing && form.values.type !== organization.type
  const effects = typeChanged ? typeChangeEffects(organization.rules, selectedRules) : []

  async function save() {
    setConfirmingType(false)
    const payload = organizationPayload(form.values, location, organization)
    const result = await form.submit(() => (isEditing ? updateOrganization(organization.id, payload) : createOrganization(payload)))
    if (result.ok) onSaved(result.data, isEditing)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (typeChanged && effects.length > 0) setConfirmingType(true)
    else save()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      <Field label="Nom" error={form.errors.name} required>
        {(props) => <Input {...props} value={form.values.name} onChange={form.handle('name')} maxLength={50} autoComplete="off" />}
      </Field>

      <Field label="Type" hint="Il décide des règles : Collège, quota, priorité." error={form.errors.type} required>
        {(props) => (
          <Select {...props} value={form.values.type} onChange={form.handle('type')}>
            <option value="">Choisir…</option>
            {(types.length > 0 ? types : ORGANIZATION_TYPES).map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail officiel" error={form.errors.official_email}>
          {(props) => <Input {...props} type="email" value={form.values.official_email} onChange={form.handle('official_email')} maxLength={255} />}
        </Field>
        <Field label="Téléphone" error={form.errors.phone_contact}>
          {(props) => <Input {...props} type="tel" value={form.values.phone_contact} onChange={form.handle('phone_contact')} maxLength={20} />}
        </Field>
      </div>

      <Field label="Personne de contact" error={form.errors.name_contact}>
        {(props) => <Input {...props} value={form.values.name_contact} onChange={form.handle('name_contact')} maxLength={255} />}
      </Field>

      <Field label="Siège social" error={form.errors.location_id}>
        {(props) => <LocationPicker value={location} onChange={setLocation} inputProps={props} placeholder="Rechercher l’adresse du siège…" />}
      </Field>

      {selectedRules?.quota_exempt ? (
        <p className="text-sm text-muted">Ce type n’a pas de quota annuel de réservations.</p>
      ) : (
        <Field label="Quota annuel" hint="Réservations approuvées ou confirmées par année civile. 0 : aucune réservation possible." error={form.errors.annual_quota} required>
          {(props) => (
            <NumberStepper
              {...props}
              value={form.values.annual_quota}
              onChange={(value) => form.setValues((values) => ({ ...values, annual_quota: value }))}
              max={1000}
              decrementLabel="Une réservation de moins"
              incrementLabel="Une réservation de plus"
            />
          )}
        </Field>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={form.submitting}>
          {isEditing ? 'Enregistrer' : 'Créer l’organisation'}
        </Button>
      </div>

      <Modal
        open={confirmingType}
        onClose={() => setConfirmingType(false)}
        title="Changer le type de l’organisation ?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmingType(false)}>
              Annuler
            </Button>
            <Button onClick={save}>Changer le type</Button>
          </>
        }
      >
        <p className="text-sm">
          « {organization?.name} » deviendra <strong>{types.find((type) => type.value === form.values.type)?.label}</strong>. En
          conséquence :
        </p>
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm">
          {effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Les réservations déjà acceptées ne changent pas.</p>
      </Modal>
    </form>
  )
}
