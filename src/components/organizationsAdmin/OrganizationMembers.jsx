import { useCallback, useState } from 'react'
import { getOrganizationMembers } from '../../api/organizations'
import { useApi } from '../../hooks/useApi'
import { EditMemberRoleModal } from '../organizations/EditMemberRoleModal'
import { MemberRow } from '../organizations/MemberRow'
import { RemoveMemberModal } from '../organizations/RemoveMemberModal'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'

// Membres d'une organisation, pour un agent : responsables d'abord, changer le rôle ou retirer (mêmes fenêtres que
// l'espace usager ; le backend garde toujours au moins un responsable). `onChanged(message)` après une action.
export function OrganizationMembers({ organization, onChanged }) {
  const fetchMembers = useCallback((signal) => getOrganizationMembers(organization.id, { signal }), [organization.id])
  const members = useApi(fetchMembers)
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)

  function handleDone(message) {
    setEditing(null)
    setRemoving(null)
    members.reload()
    onChanged(message)
  }

  if (members.error) return <ErrorState error={members.error} onRetry={members.reload} />
  if (!members.data) return <Loader />
  if (members.data.length === 0) return <p className="text-sm text-muted">Aucun membre pour l’instant.</p>

  const sorted = [...members.data].sort(
    (a, b) => Number(b.is_manager) - Number(a.is_manager) || a.full_name.localeCompare(b.full_name, 'fr'),
  )

  return (
    <>
      <ul className="-mx-5 divide-y divide-line">
        {sorted.map((member) => (
          <MemberRow key={member.user_id} member={member} isMe={false} canManage onEditRole={setEditing} onRemove={setRemoving} />
        ))}
      </ul>
      <EditMemberRoleModal
        organizationId={organization.id}
        member={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={() => handleDone('Rôle du membre modifié.')}
      />
      <RemoveMemberModal
        organization={organization}
        member={removing}
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onRemoved={() => handleDone('Membre retiré de l’organisation.')}
      />
    </>
  )
}
