import { createCalendarPeriod, updateCalendarPeriod } from '../../api/municipalityCalendar'
import { useForm } from '../../hooks/useForm'
import { calendarKind, periodFormValues, periodPayload } from '../../lib/municipalityCalendar'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Ajout (`period` absent, sorte `kind`) ou modification d'une période du calendrier. Fin vide : un seul jour.
// Le formulaire est monté à l'ouverture seulement, pour repartir de valeurs propres. `onSaved(période)` après succès.
export function CalendarPeriodModal({ open, municipalityId, kind, period, onClose, onSaved }) {
  const title = period ? `Modifier : ${period.label}` : `Ajouter : ${calendarKind(kind).singular.toLowerCase()}`

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {open && <PeriodForm municipalityId={municipalityId} kind={kind} period={period} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function PeriodForm({ municipalityId, kind, period, onClose, onSaved }) {
  const form = useForm(periodFormValues(period, kind))
  const payload = periodPayload(period, form.values)
  const unchanged = Boolean(period) && Object.keys(payload).length === 0
  const isHolidays = form.values.kind === 'vacances_scolaires'

  async function handleSubmit(event) {
    event.preventDefault()
    if (unchanged) return onClose()
    const result = await form.submit(() =>
      period ? updateCalendarPeriod(period.id, payload) : createCalendarPeriod(municipalityId, payload),
    )
    if (result.ok) onSaved(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <p className="text-sm text-muted">{calendarKind(form.values.kind).help}</p>
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field label="Nom" required error={form.errors.label} hint={isHolidays ? 'Ex. Congé d’automne, Vacances d’hiver.' : 'Ex. Fête de Wallonie, pont de l’Ascension.'}>
        {(props) => <Input {...props} value={form.values.label} onChange={form.handle('label')} maxLength={100} autoFocus />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Du" required error={form.errors.start_date}>
          {(props) => <Input {...props} type="date" value={form.values.start_date} onChange={form.handle('start_date')} />}
        </Field>
        <Field label="Au" hint="Vide : un seul jour." error={form.errors.end_date}>
          {(props) => (
            <Input {...props} type="date" value={form.values.end_date} min={form.values.start_date || undefined} onChange={form.handle('end_date')} />
          )}
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" loading={form.submitting}>
          {period ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </div>
    </form>
  )
}
