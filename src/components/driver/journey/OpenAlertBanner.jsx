import { LifeBuoy, MapPin } from 'lucide-react'
import { useState } from 'react'
import { updateDriverAlertPosition } from '../../../api/driverAlerts'
import { formatDateTime } from '../../../lib/dates'
import { readDevicePosition } from '../../../lib/devicePosition'
import { getErrorMessage } from '../../../lib/errors'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'

// Demande d'aide en cours du chauffeur, en tête de « Ma journée » :
//   ouverte          → « envoyée, un agent va vous contacter »
//   prise en charge  → « Bruno Agent s'occupe de votre demande »
// « Renvoyer ma position » si le bus s'est déplacé. `onUpdated(alert)` après un renvoi.
export function OpenAlertBanner({ alert, onUpdated }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const taken = alert.status === 'prise_en_charge'

  async function resendPosition() {
    setSending(true)
    setError(null)
    try {
      onUpdated(await updateDriverAlertPosition(alert.id, await readDevicePosition()))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <section aria-label="Demande d’aide en cours" className="grid gap-3 rounded-panel border border-danger bg-danger-soft p-4">
      <p className="flex items-start gap-2 font-bold">
        <LifeBuoy className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        {taken
          ? `${alert.handled_by ?? 'Un agent'} s’occupe de votre demande d’aide. Restez joignable.`
          : 'Demande d’aide envoyée : un agent va vous contacter.'}
      </p>
      <p className="text-sm">
        Envoyée le {formatDateTime(alert.created_at)} · {alert.position.state_label}
        {alert.position.updates > 0 && ` · position renvoyée ${alert.position.updates} fois`}
      </p>
      <div>
        <Button variant="secondary" onClick={resendPosition} loading={sending}>
          <MapPin className="size-4" aria-hidden="true" />
          Renvoyer ma position
        </Button>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </section>
  )
}
