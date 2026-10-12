import { updateMunicipality } from '../../api/municipalities'
import { useForm } from '../../hooks/useForm'
import { councilChanges, councilFormValues } from '../../lib/municipalities'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Field'
import { Panel } from '../ui/Panel'

// Composition du Collège imprimée sur les délibérations (admin) : bloc « PRÉSENTS », signataires, et destinataire
// « écoles » du modèle sans subvention. À mettre à jour après les élections ou un changement de direction.
// Champ vide : la valeur par défaut, montrée en exemple. Seuls les champs modifiés sont envoyés.
export function CouncilPanel({ municipality, notice, onSaved }) {
  const form = useForm(councilFormValues(municipality))
  const changes = councilChanges(municipality, form.values)
  const dirty = Object.keys(changes).length > 0
  const placeholder = (field) => municipality[`effective_${field}`] ?? ''

  async function handleSubmit(event) {
    event.preventDefault()
    if (!dirty) return
    const result = await form.submit(() => updateMunicipality(municipality.id, changes))
    if (result.ok) onSaved(result.data)
  }

  const textField = (field, label, maxLength) => (
    <Field label={label} error={form.errors[field]}>
      {(props) => (
        <Input {...props} value={form.values[field]} onChange={form.handle(field)} placeholder={placeholder(field)} maxLength={maxLength} />
      )}
    </Field>
  )

  return (
    <Panel title="Collège communal (délibérations)">
      <form onSubmit={handleSubmit} noValidate className="grid gap-5 p-5">
        <p className="text-sm text-muted">
          Ces noms s’impriment sur chaque délibération générée. Deux modèles existent : avec subvention en nature (ASBL,
          externes, CPAS) et sans subvention (écoles et personnel communaux). Un champ vide reprend la valeur affichée en gris.
        </p>
        {notice && !dirty && <Alert tone="success">{notice}</Alert>}
        {form.error && <Alert tone="danger">{form.error}</Alert>}

        <Field label="Présents" hint="Une ligne par personne ou par groupe, comme sur la délibération." error={form.errors.council_present_text}>
          {(props) => (
            <Textarea
              {...props}
              rows={5}
              value={form.values.council_present_text}
              onChange={form.handle('council_present_text')}
              placeholder={placeholder('council_present_text')}
              maxLength={2000}
            />
          )}
        </Field>

        <fieldset className="grid gap-4 md:grid-cols-2">
          <legend className="mb-2 text-sm font-bold">Signatures « Par le Collège »</legend>
          {textField('council_director_title', 'Titre (à gauche)', 100)}
          {textField('council_director_name', 'Nom (à gauche)', 150)}
          {textField('council_president_title', 'Titre (à droite)', 100)}
          {textField('council_president_name', 'Nom (à droite)', 150)}
        </fieldset>

        <fieldset className="grid gap-4 md:grid-cols-2">
          <legend className="mb-2 text-sm font-bold">« Pour copie conforme »</legend>
          {textField('council_mayor_title', 'Titre', 100)}
          {textField('council_mayor_name', 'Nom', 150)}
        </fieldset>

        {textField('council_schools_recipient', 'Copie pour les écoles communales (modèle sans subvention)', 255)}

        <div>
          <Button type="submit" loading={form.submitting} disabled={!dirty}>
            Enregistrer le Collège
          </Button>
        </div>
      </form>
    </Panel>
  )
}
