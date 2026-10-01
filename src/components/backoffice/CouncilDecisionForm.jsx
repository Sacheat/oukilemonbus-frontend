import { createCouncilDecision, updateCouncilDecision } from '../../api/documents'
import { useForm } from '../../hooks/useForm'
import { todayApiDate } from '../../lib/reservations'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ChoicePills } from '../ui/ChoicePills'
import { Field, Input, Textarea } from '../ui/Field'

const DECISION_OPTIONS = [
  { value: 'approuve', label: 'Favorable' },
  { value: 'refuse', label: 'Défavorable' },
  { value: 'en_attente', label: 'En attente' },
]

// Décision du Collège pour une réservation : création, ou modification de `decision` s'il y en a une.
// Favorable ou défavorable génère la délibération PDF et prévient le demandeur (côté backend).
export function CouncilDecisionForm({ reservation, decision = null, onSaved, onCancel }) {
  const form = useForm({
    decision_status: decision?.decision_status ?? 'approuve',
    decision_date: decision?.decision_date ?? todayApiDate(),
    decision_reference: decision?.decision_reference ?? '',
    notes: decision?.notes ?? '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) =>
      decision ? updateCouncilDecision(decision.id, values) : createCouncilDecision({ reservation_id: reservation.id, ...values }),
    )
    if (result.ok) onSaved(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <p className="text-sm text-muted">
        « {reservation.trip_purpose} ». Une décision favorable ou défavorable génère la délibération et prévient le demandeur.
      </p>
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <ChoicePills
        legend="Avis du Collège"
        required
        options={DECISION_OPTIONS}
        value={form.values.decision_status}
        onChange={(value) => form.setValues((current) => ({ ...current, decision_status: value }))}
        error={form.errors.decision_status}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de la décision" error={form.errors.decision_date}>
          {(props) => <Input {...props} type="date" value={form.values.decision_date} onChange={form.handle('decision_date')} />}
        </Field>
        <Field label="Référence" hint="Facultatif." error={form.errors.decision_reference}>
          {(props) => <Input {...props} maxLength={100} value={form.values.decision_reference} onChange={form.handle('decision_reference')} />}
        </Field>
      </div>
      <Field label="Remarques" hint="Facultatif." error={form.errors.notes}>
        {(props) => <Textarea {...props} maxLength={500} value={form.values.notes} onChange={form.handle('notes')} />}
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Retour
        </Button>
        <Button type="submit" loading={form.submitting}>
          Enregistrer la décision
        </Button>
      </div>
    </form>
  )
}
