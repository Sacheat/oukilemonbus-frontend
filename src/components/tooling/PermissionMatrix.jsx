import { Check } from 'lucide-react'
import { ROLE_LABELS } from '../../lib/labels'
import { permissionGroups } from '../../lib/tooling'
import { GLOBAL_ROLES } from '../../lib/users'

// Matrice rôles × permissions (GET /toolbox/permissions), permissions regroupées par domaine.
// Défile horizontalement dans son cadre sur petit écran.
export function PermissionMatrix({ data }) {
  const roles = [...GLOBAL_ROLES.filter((role) => data.roles.includes(role)), ...data.roles.filter((role) => !GLOBAL_ROLES.includes(role))]
  const granted = Object.fromEntries(roles.map((role) => [role, new Set(data.matrix[role] ?? [])]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <caption className="sr-only">Permissions accordées à chaque rôle</caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="px-5 py-2 font-semibold text-muted">
              Permission
            </th>
            {roles.map((role) => (
              <th key={role} scope="col" className="px-3 py-2 text-center font-semibold">
                {ROLE_LABELS[role] ?? role}
                <span className="block text-xs font-normal text-muted tabular-nums">{granted[role].size}</span>
              </th>
            ))}
          </tr>
        </thead>
        {permissionGroups(data.permissions).map((group) => (
          <tbody key={group.domain} className="border-b border-line">
            <tr>
              <th scope="rowgroup" colSpan={roles.length + 1} className="bg-surface-muted px-5 py-1.5 text-left font-mono text-xs font-semibold">
                {group.domain}
              </th>
            </tr>
            {group.items.map((item) => (
              <tr key={item.permission}>
                <th scope="row" className="px-5 py-1.5 text-left font-mono text-xs font-normal">
                  {item.action}
                </th>
                {roles.map((role) => (
                  <td key={role} className="px-3 py-1.5 text-center">
                    {granted[role].has(item.permission) ? (
                      <Check className="mx-auto size-4 text-success" aria-label="Oui" />
                    ) : (
                      <span className="text-line-strong" aria-label="Non">
                        ·
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
