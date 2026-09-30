import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../ui/Button'
import { CancelUnavailabilityModal } from './CancelUnavailabilityModal'

// Bas du panneau : bouton d'annulation (permission unavailabilities.cancel) et sa confirmation
export function UnavailabilityCancelControl({ unavailability, subject, onCancelled }) {
  const { can } = useAuth()
  const [confirming, setConfirming] = useState(false)
  if (!can('unavailabilities.cancel')) return null

  return (
    <section className="grid gap-3 border-t border-line pt-5">
      <h3 className="font-bold">Annulation</h3>
      <p className="text-sm text-muted">L'indisponibilité est conservée, mais ne bloque plus les affectations.</p>
      <div>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Annuler l'indisponibilité
        </Button>
      </div>
      <CancelUnavailabilityModal
        unavailability={unavailability}
        subject={subject}
        open={confirming}
        onClose={() => setConfirming(false)}
        onCancelled={onCancelled}
      />
    </section>
  )
}
