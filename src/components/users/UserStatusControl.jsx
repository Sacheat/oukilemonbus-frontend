import { useState } from 'react'
import { updateUserStatus } from '../../api/users'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { DeactivateUserModal } from './DeactivateUserModal'

// Bas du panneau : désactiver (avec confirmation) ou réactiver (direct) un compte.
// `self` : son propre compte, qu'on ne peut pas désactiver (on perdrait l'accès). Le backend reste l'autorité.
export function UserStatusControl({ user, self, onChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState(null)

  async function handleActivate() {
    setActivating(true)
    setError(null)
    try {
      onChanged(await updateUserStatus(user.id, true))
    } catch (err) {
      setError(getErrorMessage(err))
      setActivating(false)
    }
  }

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Accès</h3>
      {error && <Alert tone="danger">{error}</Alert>}

      {self ? (
        <p className="text-sm text-muted">Vous ne pouvez pas désactiver votre propre compte.</p>
      ) : user.active ? (
        <>
          <p className="text-sm text-muted">Un compte désactivé ne peut plus se connecter.</p>
          <div>
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Désactiver le compte
            </Button>
          </div>
          <DeactivateUserModal user={user} open={confirming} onClose={() => setConfirming(false)} onDeactivated={onChanged} />
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Ce compte est désactivé : la personne ne peut plus se connecter.</p>
          <div>
            <Button variant="secondary" onClick={handleActivate} loading={activating}>
              Réactiver le compte
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
