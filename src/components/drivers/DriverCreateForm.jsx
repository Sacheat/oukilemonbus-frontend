import { getAllDrivers } from '../../api/drivers'
import { useApi } from '../../hooks/useApi'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { DriverForm } from './DriverForm'

// Ajout d'un chauffeur : charge une fois les chauffeurs existants (pour écarter les comptes qui ont déjà
// un profil), puis la recherche de compte interroge le backend à chaque frappe (AccountPicker).
function fetchDriverList(signal) {
  return getAllDrivers({ signal })
}

export function DriverCreateForm({ onSaved }) {
  const drivers = useApi(fetchDriverList) // défini hors du composant : même fonction à chaque rendu

  if (drivers.error) return <ErrorState error={drivers.error} onRetry={drivers.reload} />
  if (!drivers.data) return <Loader />
  return <DriverForm driverList={drivers.data} onSaved={onSaved} />
}
