import { useCallback } from 'react'
import { getUnavailability } from '../../api/unavailabilities'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import {
  getUnavailabilityPeriod,
  NEW_UNAVAILABILITY,
  unavailabilitySubject,
  withOpenedDriver,
  withOpenedVehicle,
} from '../../lib/unavailabilities'
import { Alert } from '../ui/Alert'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { UnavailabilityCancelControl } from './UnavailabilityCancelControl'
import { UnavailabilityDetails } from './UnavailabilityDetails'
import { UnavailabilityForm } from './UnavailabilityForm'

// Contenu du panneau latéral selon ?indisponibilite= :
//   'nouvelle'                          → formulaire de déclaration
//   indisponibilité annulée ou terminée → détail en lecture seule
//   indisponibilité en cours ou à venir → formulaire de modification (ou détail sans le droit de modifier) + annulation
// L'indisponibilité ouverte est relue par GET /unavailabilities/{id} (la liste n'en contient qu'une page).
// `fleet` : { driverList, vehicleList } actifs, chargés par la page (undefined pendant le chargement).
export function UnavailabilityDrawerContent({ unavailabilityParam, fleet, onSaved, onCancelled }) {
  const { can } = useAuth()

  if (unavailabilityParam === NEW_UNAVAILABILITY) {
    if (!can('unavailabilities.create')) {
      return <Alert tone="danger">Vous n'avez pas le droit de déclarer une indisponibilité.</Alert>
    }
    if (!fleet) return <Loader />
    return <UnavailabilityForm driverList={fleet.driverList} vehicleList={fleet.vehicleList} onSaved={onSaved} />
  }

  if (!/^\d+$/.test(unavailabilityParam)) return <Alert tone="warning">Cette indisponibilité est introuvable.</Alert>

  return <OpenedUnavailability unavailabilityId={unavailabilityParam} fleet={fleet} onSaved={onSaved} onCancelled={onCancelled} />
}

function OpenedUnavailability({ unavailabilityId, fleet, onSaved, onCancelled }) {
  const { can } = useAuth()
  const fetchUnavailability = useCallback((signal) => getUnavailability(unavailabilityId, { signal }), [unavailabilityId])
  const opened = useApi(fetchUnavailability)

  if (opened.error?.response?.status === 404) return <Alert tone="warning">Cette indisponibilité est introuvable.</Alert>
  if (opened.error) return <ErrorState error={opened.error} onRetry={opened.reload} />
  if (!opened.data || !fleet) return <Loader />

  const unavailability = opened.data
  const subject = unavailabilitySubject(unavailability)

  // Annulée ou terminée : lecture seule (modifier une période passée ferait passer d'anciennes réservations en conflit)
  const period = getUnavailabilityPeriod(unavailability)
  if (period !== 'a-venir') {
    return (
      <>
        <Alert>
          {period === 'annulees'
            ? 'Cette indisponibilité a été annulée : elle ne bloque plus les affectations.'
            : 'Cette indisponibilité est terminée : elle ne peut plus être modifiée.'}
        </Alert>
        <UnavailabilityDetails unavailability={unavailability} subject={subject} />
      </>
    )
  }

  return (
    <>
      {can('unavailabilities.update') ? (
        <UnavailabilityForm
          key={unavailability.id}
          unavailability={unavailability}
          driverList={withOpenedDriver(fleet.driverList, unavailability)}
          vehicleList={withOpenedVehicle(fleet.vehicleList, unavailability)}
          onSaved={onSaved}
        />
      ) : (
        <UnavailabilityDetails unavailability={unavailability} subject={subject} />
      )}
      <UnavailabilityCancelControl unavailability={unavailability} subject={subject} onCancelled={onCancelled} />
    </>
  )
}
