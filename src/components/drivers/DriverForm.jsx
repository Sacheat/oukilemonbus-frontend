import { createDriver, updateDriver } from '../../api/drivers'
import { useForm } from '../../hooks/useForm'
import { changedLicenceFields, driverFormValues, tomorrowApiDate } from '../../lib/drivers'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { AccountPicker } from './AccountPicker'

// Formulaire d'ajout (avec `accounts` : comptes à rechercher) ou de modification du permis (avec `driver`).
// Les erreurs 422 (numéro déjà utilisé, date passée…) s'affichent sous le champ concerné.
export function DriverForm({ driver, accounts, onSaved }) {
  const form = useForm(driverFormValues(driver))
  const isEditing = Boolean(driver)

  // Le formulaire garde l'id du compte ; le composant de recherche a besoin du compte entier
  const selectedAccount = accounts?.find((account) => String(account.id) === form.values.user_id) ?? null

  function chooseAccount(account) {
    form.setValues((values) => ({ ...values, user_id: account ? String(account.id) : '' }))
  }

  async function saveDriver(values) {
    if (!isEditing) return createDriver(values)
    const changes = changedLicenceFields(driver, values)
    if (Object.keys(changes).length === 0) return driver // rien n'a changé : pas de requête
    return updateDriver(driver.id, changes)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(saveDriver)
    if (result.ok) onSaved(result.data, isEditing)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      {!isEditing && (
        <Field
          label="Compte"
          hint="Le compte reçoit automatiquement le rôle chauffeur."
          error={form.errors.user_id}
          required
        >
          {(props) => (
            <AccountPicker accounts={accounts} value={selectedAccount} onChange={chooseAccount} inputProps={props} />
          )}
        </Field>
      )}

      <Field label="Numéro de permis" error={form.errors.licence_number} required>
        {(props) => (
          <Input
            {...props}
            value={form.values.licence_number}
            onChange={form.handle('licence_number')}
            maxLength={20}
            autoComplete="off"
          />
        )}
      </Field>

      <Field
        label="Date d'expiration du permis"
        hint="Doit être postérieure à aujourd'hui."
        error={form.errors.licence_expiry_date}
        required
      >
        {(props) => (
          <Input
            {...props}
            type="date"
            min={tomorrowApiDate()}
            value={form.values.licence_expiry_date}
            onChange={form.handle('licence_expiry_date')}
          />
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          {isEditing ? 'Enregistrer' : 'Ajouter le chauffeur'}
        </Button>
      </div>
    </form>
  )
}
