import { useCallback } from 'react'
import { getAllDrivers } from '../../api/drivers'
import { getAllUsers } from '../../api/users'
import { useApi } from '../../hooks/useApi'
import { getEligibleAccounts } from '../../lib/drivers'
import { Alert } from '../ui/Alert'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { DriverForm } from './DriverForm'

// Ajout d'un chauffeur : charge les comptes et les chauffeurs existants,
// puis permet de rechercher parmi les comptes actifs qui n'ont pas encore de profil chauffeur.
// Chargés une seule fois à l'ouverture : la recherche filtre ensuite dans le navigateur, sans requête.
export function DriverCreateForm({ onSaved }) {
  const fetchEligibleAccounts = useCallback(async (signal) => {
    const [userList, driverList] = await Promise.all([getAllUsers({ signal }), getAllDrivers({ signal })])
    return getEligibleAccounts(userList, driverList)
  }, [])
  const eligibleAccounts = useApi(fetchEligibleAccounts)

  if (eligibleAccounts.error) return <ErrorState error={eligibleAccounts.error} onRetry={eligibleAccounts.reload} />
  if (!eligibleAccounts.data) return <Loader />
  if (eligibleAccounts.data.length === 0) {
    return (
      <Alert title="Aucun compte disponible">
        Tous les comptes actifs ont déjà un profil chauffeur. La personne doit d'abord avoir un compte (inscription sur
        le site ou création par un administrateur).
      </Alert>
    )
  }

  return <DriverForm accounts={eligibleAccounts.data} onSaved={onSaved} />
}
