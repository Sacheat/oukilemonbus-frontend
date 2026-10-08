import { useState } from 'react'
import { updateMunicipality } from '../../api/municipalities'
import { useForm } from '../../hooks/useForm'
import {
  ownerChangeText,
  searchInternalAccounts,
  WEEKDAYS,
  weekdayLabel,
  weeklyPlanningChanges,
  weeklyPlanningFormValues,
} from '../../lib/weeklyPlanning'
import { AccountPicker } from '../drivers/AccountPicker'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { Panel } from '../ui/Panel'
import { Switch } from '../ui/Switch'

// Compte du responsable tel que renvoyé par la commune, au format du sélecteur de compte
function ownerAccount(municipality) {
  const owner = municipality.weekly_planning_owner
  return owner ? { id: owner.id, full_name: owner.name, email: owner.email, active: owner.active } : null
}

// Planning hebdomadaire envoyé automatiquement (admin seulement ; le backend refuse ces champs à un agent) :
// envoi activé, jour et heure, responsable du planning. Changer le responsable passe par une confirmation qui annonce
// l'effet (lui seul le reçoit par défaut ; sans responsable, tout le monde). `onSaved(municipalité)` après
// l'enregistrement, `onUnchanged()` si rien n'a changé.
export function WeeklyPlanningPanel({ municipality, onSaved, onUnchanged }) {
  const form = useForm(weeklyPlanningFormValues(municipality))
  const [owner, setOwner] = useState(() => ownerAccount(municipality))
  const [confirmOwner, setConfirmOwner] = useState(false)
  const { values } = form
  const ownerChanged = (owner?.id ?? null) !== (municipality.weekly_planning_owner_user_id ?? null)

  async function save() {
    setConfirmOwner(false)
    const changes = weeklyPlanningChanges(municipality, values, owner)
    if (Object.keys(changes).length === 0) {
      onUnchanged()
      return
    }
    const result = await form.submit(() => updateMunicipality(municipality.id, changes))
    if (result.ok) onSaved(result.data)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (ownerChanged) setConfirmOwner(true)
    else save()
  }

  return (
    <Panel title="Planning hebdomadaire">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-5">
        <p className="text-sm text-muted">
          Le planning de la semaine suivante (Excel, trajets approuvés et confirmés) part automatiquement aux agents et
          aux administrateurs. Si un trajet change ensuite, une version corrigée part au plus une fois par heure, jusqu’à
          la fin de la semaine concernée.
        </p>
        {form.error && <Alert tone="danger">{form.error}</Alert>}

        <Switch
          label="Envoi automatique du planning"
          checked={values.weekly_planning_enabled}
          onChange={form.handle('weekly_planning_enabled')}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Jour de l’envoi" error={form.errors.weekly_planning_send_day}>
            {(props) => (
              <Select
                {...props}
                value={values.weekly_planning_send_day}
                onChange={form.handle('weekly_planning_send_day')}
                disabled={!values.weekly_planning_enabled}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Heure de l’envoi" hint="Heure de Bruxelles." error={form.errors.weekly_planning_send_time}>
            {(props) => (
              <Input
                {...props}
                type="time"
                value={values.weekly_planning_send_time}
                onChange={form.handle('weekly_planning_send_time')}
                disabled={!values.weekly_planning_enabled}
              />
            )}
          </Field>
        </div>

        <Field
          label="Responsable du planning (facultatif)"
          hint="Un agent ou un administrateur. S’il est désigné, lui seul reçoit le planning par défaut ; les autres peuvent l’activer dans leurs notifications (absence, remplacement). Sans responsable, tous le reçoivent."
          error={form.errors.weekly_planning_owner_user_id}
        >
          {(props) => (
            <AccountPicker
              search={searchInternalAccounts}
              value={owner}
              onChange={setOwner}
              inputProps={props}
              emptyText="Aucun agent ni administrateur actif ne correspond."
            />
          )}
        </Field>
        {owner && owner.active === false && (
          <Alert tone="warning">Ce compte est désactivé : le planning part à tous les agents et administrateurs.</Alert>
        )}

        <div>
          <Button type="submit" loading={form.submitting}>
            Enregistrer le planning hebdomadaire
          </Button>
        </div>
      </form>

      <Modal open={confirmOwner} onClose={() => setConfirmOwner(false)} title="Responsable du planning">
        {confirmOwner && (
          <div className="grid gap-4">
            <p>{ownerChangeText(owner)}</p>
            {values.weekly_planning_enabled && (
              <p className="text-sm text-muted">
                Prochain envoi : {weekdayLabel(values.weekly_planning_send_day).toLowerCase()} à {values.weekly_planning_send_time}.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmOwner(false)}>
                Annuler
              </Button>
              <Button onClick={save} loading={form.submitting}>
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Panel>
  )
}
