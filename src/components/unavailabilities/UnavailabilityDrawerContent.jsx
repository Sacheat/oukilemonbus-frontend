import { useAuth } from '../../auth/useAuth'
import { getUnavailabilityPeriod, NEW_UNAVAILABILITY, unavailabilitySubject } from '../../lib/unavailabilities'
import { Alert } from '../ui/Alert'
import { Loader } from '../ui/Loader'
import { UnavailabilityCancelControl } from './UnavailabilityCancelControl'
import { UnavailabilityDetails } from './UnavailabilityDetails'
import { UnavailabilityForm } from './UnavailabilityForm'

// Contenu du panneau latéral selon ?indisponibilite= :
//   'nouvelle'                          → formulaire de déclaration
//   indisponibilité annulée ou terminée → détail en lecture seule
//   indisponibilité en cours ou à venir → formulaire de modification (ou détail sans le droit de modifier) + annulation
// `pageData` : { unavailabilityList, driverList, vehicleList } chargés par la page (undefined pendant le chargement)
export function UnavailabilityDrawerContent({ unavailabilityParam, pageData, onSaved, onCancelled }) {
  const { can } = useAuth()

  if (unavailabilityParam === NEW_UNAVAILABILITY) {
    if (!can('unavailabilities.create')) {
      return <Alert tone="danger">Vous n'avez pas le droit de déclarer une indisponibilité.</Alert>
    }
    if (!pageData) return <Loader />
    return <UnavailabilityForm driverList={pageData.driverList} vehicleList={pageData.vehicleList} onSaved={onSaved} />
  }

  if (!pageData) return <Loader />

  const { unavailabilityList, driverList, vehicleList } = pageData
  const openedUnavailability = unavailabilityList.find((item) => String(item.id) === unavailabilityParam)
  if (!openedUnavailability) return <Alert tone="warning">Cette indisponibilité est introuvable.</Alert>

  const subject = unavailabilitySubject(openedUnavailability, driverList, vehicleList)

  // Annulée ou terminée : lecture seule (modifier une période passée ferait passer d'anciennes réservations en conflit)
  const period = getUnavailabilityPeriod(openedUnavailability)
  if (period !== 'a-venir') {
    return (
      <>
        <Alert>
          {period === 'annulees'
            ? 'Cette indisponibilité a été annulée : elle ne bloque plus les affectations.'
            : 'Cette indisponibilité est terminée : elle ne peut plus être modifiée.'}
        </Alert>
        <UnavailabilityDetails unavailability={openedUnavailability} subject={subject} />
      </>
    )
  }

  return (
    <>
      {can('unavailabilities.update') ? (
        <UnavailabilityForm
          key={openedUnavailability.id}
          unavailability={openedUnavailability}
          driverList={driverList}
          vehicleList={vehicleList}
          onSaved={onSaved}
        />
      ) : (
        <UnavailabilityDetails unavailability={openedUnavailability} subject={subject} />
      )}
      <UnavailabilityCancelControl unavailability={openedUnavailability} subject={subject} onCancelled={onCancelled} />
    </>
  )
}
