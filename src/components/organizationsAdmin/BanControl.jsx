import { Ban, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { banOrganization, unbanOrganization } from '../../api/organizations'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Checkbox, Field, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Bannir ou réactiver une organisation (admin) :
//   bannir    → motif obligatoire ; case « annuler aussi ses N réservations à venir » (décochée par défaut) ;
//               les membres sont prévenus. Les réservations qui n'ont pas pu être annulées sont signalées.
//   réactiver → confirmation ; les membres sont prévenus.
// `onChanged(organisation, message)` après l'action.
export function BanControl({ organization, onChanged }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="grid gap-3">
      {organization.is_banned ? (
        <Alert tone="danger" title="Organisation bannie">
          {organization.banned_reason ? `Motif : ${organization.banned_reason}` : 'Elle ne peut plus réserver le bus.'}
        </Alert>
      ) : (
        <p className="text-sm text-muted">Une organisation bannie ne peut plus faire de nouvelle demande de réservation.</p>
      )}
      <div>
        <Button variant={organization.is_banned ? 'secondary' : 'danger'} onClick={() => setOpen(true)}>
          {organization.is_banned ? <RotateCcw className="size-4" aria-hidden="true" /> : <Ban className="size-4" aria-hidden="true" />}
          {organization.is_banned ? 'Réactiver l’organisation' : 'Bannir l’organisation'}
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={organization.is_banned ? `Réactiver « ${organization.name} » ?` : `Bannir « ${organization.name} »`}
      >
        {open &&
          (organization.is_banned ? (
            <UnbanForm organization={organization} onCancel={() => setOpen(false)} onDone={(updated, message) => { setOpen(false); onChanged(updated, message) }} />
          ) : (
            <BanForm organization={organization} onCancel={() => setOpen(false)} onDone={(updated, message) => { setOpen(false); onChanged(updated, message) }} />
          ))}
      </Modal>
    </div>
  )
}

function BanForm({ organization, onCancel, onDone }) {
  const [reason, setReason] = useState('')
  const [cancelUpcoming, setCancelUpcoming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [reasonError, setReasonError] = useState(null)
  const upcoming = organization.upcoming_reservations_count ?? 0

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setError(null)
    setReasonError(null)
    try {
      const result = await banOrganization(organization.id, { reason: reason.trim(), cancelUpcoming })
      const parts = [`« ${organization.name} » est bannie : ses membres sont prévenus.`]
      if (result.cancelled.length > 0) parts.push(`${result.cancelled.length} réservation${result.cancelled.length > 1 ? 's' : ''} annulée${result.cancelled.length > 1 ? 's' : ''}.`)
      if (result.skipped.length > 0) {
        parts.push(`Non annulée${result.skipped.length > 1 ? 's' : ''} : ${result.skipped.map((item) => `n° ${item.id} (${item.reason})`).join(' ; ')}.`)
      }
      onDone(result.organization, parts.join(' '))
    } catch (err) {
      const fields = getFieldErrors(err)
      if (fields.reason) setReasonError(fields.reason)
      else setError(getErrorMessage(err))
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <p className="text-sm">Elle ne pourra plus faire de nouvelle demande de réservation. Ses membres seront prévenus, avec le motif.</p>
      <Field label="Motif" hint="Il est envoyé aux membres." error={reasonError} required>
        {(props) => <Textarea {...props} rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />}
      </Field>
      {upcoming > 0 ? (
        <Checkbox
          label={`Annuler aussi ses ${upcoming} réservation${upcoming > 1 ? 's' : ''} à venir (demandeur et chauffeur prévenus)`}
          checked={cancelUpcoming}
          onChange={(event) => setCancelUpcoming(event.target.checked)}
        />
      ) : (
        <p className="text-sm text-muted">Elle n’a aucune réservation à venir.</p>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="danger" loading={sending}>
          Bannir
        </Button>
      </div>
    </form>
  )
}

function UnbanForm({ organization, onCancel, onDone }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setSending(true)
    setError(null)
    try {
      onDone(await unbanOrganization(organization.id), `« ${organization.name} » peut de nouveau réserver : ses membres sont prévenus.`)
    } catch (err) {
      setError(getErrorMessage(err))
      setSending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">Elle pourra de nouveau faire des demandes de réservation. Ses membres seront prévenus.</p>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleConfirm} loading={sending}>
          Réactiver
        </Button>
      </div>
    </div>
  )
}
