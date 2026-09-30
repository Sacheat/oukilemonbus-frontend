import { updateMemberRelationship } from '../../api/organizations'
import { useForm } from '../../hooks/useForm'
import { MANAGER_ROLES, MEMBER_ROLES } from '../../lib/organizations'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Changement de la relation d'un membre avec l'organisation (réservé aux responsables)
export function EditMemberRoleModal({ organizationId, member, open, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={member ? `Rôle de ${member.full_name}` : 'Modifier le rôle'}>
      {open && member && <RoleForm organizationId={organizationId} member={member} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function RoleForm({ organizationId, member, onClose, onSaved }) {
  const form = useForm({ relationship_type: member.relationship_type })
  const unchanged = form.values.relationship_type === member.relationship_type
  const willManage = MANAGER_ROLES.includes(form.values.relationship_type)

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit(({ relationship_type }) =>
      updateMemberRelationship(organizationId, member.user_id, relationship_type),
    )
    if (result.ok) onSaved(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}
      <Field
        label="Rôle"
        required
        hint={
          willManage
            ? 'Gère les membres et toutes les réservations de l’organisation.'
            : 'Voit les réservations de l’organisation et gère seulement les siennes.'
        }
        error={form.errors.relationship_type}
      >
        {(props) => (
          <Select {...props} value={form.values.relationship_type} onChange={form.handle('relationship_type')}>
            {MEMBER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button type="submit" loading={form.submitting} disabled={unchanged}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
