import { useState } from 'react'
import { activateVehicle } from '../../api/vehicles'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { DeactivateVehicleModal } from './DeactivateVehicleModal'

// Bas du panneau : retirer du service (avec confirmation) ou remettre en service (direct).
// Chaque bouton n'apparaît qu'avec sa permission ; le backend reste l'autorité (403).
export function VehicleStatusControl({ vehicle, onChanged }) {
  const { can } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState(null)

  const canDeactivate = vehicle.is_active && can('vehicles.deactivate')
  const canActivate = !vehicle.is_active && can('vehicles.update')
  if (!canDeactivate && !canActivate) return null

  async function handleActivate() {
    setActivating(true)
    setError(null)
    try {
      onChanged(await activateVehicle(vehicle.id))
    } catch (err) {
      setError(getErrorMessage(err))
      setActivating(false)
    }
  }

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Mise en service</h3>
      {error && <Alert tone="danger">{error}</Alert>}

      {canDeactivate ? (
        <>
          <p className="text-sm text-muted">Un véhicule retiré du service n'est plus proposé pour les affectations.</p>
          <div>
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Retirer du service
            </Button>
          </div>
          <DeactivateVehicleModal
            vehicle={vehicle}
            open={confirming}
            onClose={() => setConfirming(false)}
            onDeactivated={onChanged}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Ce véhicule est retiré du service.</p>
          <div>
            <Button variant="secondary" onClick={handleActivate} loading={activating}>
              Remettre en service
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
