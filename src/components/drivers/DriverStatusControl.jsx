import { useState } from 'react'
import { activateDriver } from '../../api/drivers'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { DeactivateDriverModal } from './DeactivateDriverModal'

// Bas du panneau : désactiver (avec confirmation) ou réactiver (direct).
// Chaque bouton n'apparaît qu'avec sa permission ; le backend reste l'autorité (403).
export function DriverStatusControl({ driver, onChanged }) {
  const { can } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState(null)

  const canDeactivate = driver.is_active && can('drivers.deactivate')
  const canActivate = !driver.is_active && can('drivers.update')
  if (!canDeactivate && !canActivate) return null

  async function handleActivate() {
    setActivating(true)
    setError(null)
    try {
      onChanged(await activateDriver(driver.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setActivating(false)
    }
  }

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Activité</h3>
      {error && <Alert tone="danger">{error}</Alert>}

      {canDeactivate ? (
        <>
          <p className="text-sm text-muted">Un chauffeur désactivé n'est plus proposé pour les affectations.</p>
          <div>
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Désactiver le chauffeur
            </Button>
          </div>
          <DeactivateDriverModal driver={driver} open={confirming} onClose={() => setConfirming(false)} onDeactivated={onChanged} />
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Ce chauffeur est désactivé.</p>
          <div>
            <Button variant="secondary" onClick={handleActivate} loading={activating}>
              Réactiver le chauffeur
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
