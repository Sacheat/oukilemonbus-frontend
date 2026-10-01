import { useState } from 'react'
import { createCouncilDecision, updateCouncilDecision } from '../../api/councilDecisions'
import { useForm } from '../../hooks/useForm'
import { decisionFormValues, DECISION_OPTIONS, needsRefusalConfirmation, submitLabel } from '../../lib/councilDecisions'
import { todayInBrussels } from '../../lib/planning'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ChoicePills } from '../ui/ChoicePills'
import { Field, Input, Textarea } from '../ui/Field'
import { ConfirmRefusalModal } from './ConfirmRefusalModal'

// Encodage de la décision du Collège pour une réservation : création, ou modification si elle existe déjà.
//   si « Refusée » est choisi (et que ce n'était pas déjà un refus) → confirmation avant d'enregistrer
//   sinon → enregistrement direct
// Les erreurs 422 s'affichent sous les champs (ou en haut, ex. « aucune décision requise pour ce type »).
// `notesOnly` (trajet passé) : seules les notes s'affichent ; statut, date et référence sont renvoyés inchangés.
export function DecisionForm({ reservation, existingDecision, onSaved, notesOnly = false }) {
  const form = useForm(decisionFormValues(existingDecision, todayInBrussels()))
  const [confirmingRefusal, setConfirmingRefusal] = useState(false)

  async function saveDecision() {
    const result = await form.submit((values) =>
      existingDecision
        ? updateCouncilDecision(existingDecision.id, values)
        : createCouncilDecision(reservation.id, values),
    )
    if (result.ok) onSaved(result.data)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (needsRefusalConfirmation(form.values, existingDecision)) setConfirmingRefusal(true)
    else saveDecision()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      {!notesOnly && (
        <>
          <ChoicePills
            legend="Décision du Collège"
            options={DECISION_OPTIONS}
            value={form.values.decision_status}
            onChange={(value) => form.setValues((values) => ({ ...values, decision_status: value }))}
            hint="« En attente » : examinée mais reportée ; la réservation reste bloquée."
            error={form.errors.decision_status}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date de la séance" error={form.errors.decision_date}>
              {(props) => (
                <Input {...props} type="date" value={form.values.decision_date} onChange={form.handle('decision_date')} />
              )}
            </Field>
            <Field label="Référence de la délibération" error={form.errors.decision_reference}>
              {(props) => (
                <Input
                  {...props}
                  maxLength={100}
                  value={form.values.decision_reference}
                  onChange={form.handle('decision_reference')}
                  placeholder="Ex. COL-2026-050"
                />
              )}
            </Field>
          </div>
        </>
      )}

      <Field
        label="Notes"
        hint="En cas de refus, elles servent de motif communiqué au demandeur."
        error={form.errors.notes}
      >
        {(props) => <Textarea {...props} maxLength={500} value={form.values.notes} onChange={form.handle('notes')} />}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          {submitLabel(notesOnly, existingDecision)}
        </Button>
      </div>

      <ConfirmRefusalModal
        open={confirmingRefusal}
        reservation={reservation}
        onClose={() => setConfirmingRefusal(false)}
        onConfirm={() => {
          setConfirmingRefusal(false)
          saveDecision()
        }}
      />
    </form>
  )
}
