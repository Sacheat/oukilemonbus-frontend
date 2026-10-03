import { useState } from 'react'
import { updateUserRoles } from '../../api/users'
import { ROLE_LABELS } from '../../lib/labels'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { GLOBAL_ROLES, sameRoles } from '../../lib/users'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Field'

const ROLE_HINTS = {
  admin: 'Tout l’espace gestion, l’administration et les outils.',
  agent_communal: 'Réservations, planning, Collège, flotte et organisations.',
  chauffeur: 'Ses missions, comptes rendus et feuilles de route.',
  user: 'Réserver le bus pour ses organisations.',
}

// Rôles globaux d'un compte, en cases à cocher (au moins un). `self` : son propre compte, le rôle admin reste coché
// pour ne pas perdre l'accès à l'administration. Le backend refuse de retirer le rôle du dernier admin actif.
export function UserRolesForm({ user, self, onSaved }) {
  const [roles, setRoles] = useState(user.roles)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const unchanged = sameRoles(roles, user.roles)

  function toggle(role, checked) {
    setRoles((current) => (checked ? [...current, role] : current.filter((item) => item !== role)))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      onSaved(await updateUserRoles(user.id, GLOBAL_ROLES.filter((role) => roles.includes(role))))
    } catch (err) {
      setError(getFieldErrors(err).roles ?? getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <fieldset className="grid gap-1">
        <legend className="sr-only">Rôles</legend>
        {GLOBAL_ROLES.map((role) => {
          const locked = self && role === 'admin' && user.roles.includes('admin')
          return (
            <div key={role} className="rounded-control border border-line px-3 py-1">
              <Checkbox
                label={<span className="font-semibold">{ROLE_LABELS[role]}</span>}
                checked={roles.includes(role)}
                disabled={locked}
                onChange={(event) => toggle(role, event.target.checked)}
              />
              <p className="-mt-2 pb-1.5 pl-6 text-xs text-muted">
                {locked ? 'Vous ne pouvez pas retirer votre propre rôle administrateur.' : ROLE_HINTS[role]}
              </p>
            </div>
          )
        })}
      </fieldset>
      {roles.length === 0 && <p className="text-sm text-danger">Cochez au moins un rôle.</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" loading={saving} disabled={unchanged || roles.length === 0}>
          Enregistrer les rôles
        </Button>
      </div>
    </form>
  )
}
