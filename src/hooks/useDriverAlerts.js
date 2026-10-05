import { useCallback } from 'react'
import { getDriverAlerts } from '../api/driverAlerts'
import { useApi } from './useApi'
import { useAutoRefresh } from './useAutoRefresh'

// Demandes d'aide d'une page de la liste (filtre et page en valeurs simples : rechargement seulement s'ils changent),
// relues toutes les 60 s et au retour sur l'onglet : une nouvelle alerte apparaît sans recharger la page.
export function useDriverAlerts(statusesKey, page, perPage = 15) {
  const fetchAlerts = useCallback(
    (signal) =>
      getDriverAlerts(
        { statuses: statusesKey ? statusesKey.split(',') : undefined, page, per_page: perPage },
        { signal },
      ),
    [statusesKey, page, perPage],
  )
  const alerts = useApi(fetchAlerts)
  useAutoRefresh(alerts.reload)
  return alerts
}
