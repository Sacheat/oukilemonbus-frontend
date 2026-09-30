import { progressSteps } from '../../lib/tripProgress'
import { ProgressSteps } from '../ui/ProgressSteps'

// Suivi d'un déplacement en étapes (demande envoyée, validation, affectation, jour du trajet)
export function TripProgress({ reservation }) {
  return <ProgressSteps steps={progressSteps(reservation)} />
}
