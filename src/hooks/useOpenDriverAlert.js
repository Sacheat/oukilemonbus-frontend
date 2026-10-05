import { useCallback } from 'react'
import { getDriverAlerts } from '../api/driverAlerts'
import { useAutoRefresh } from './useAutoRefresh'
import { useApi } from './useApi'

// Dernière demande d'aide non clôturée du chauffeur connecté (le backend ne renvoie que les siennes), relue toutes
// les 60 s et au retour sur l'onglet, pour voir « prise en charge » arriver. data : l'alerte, ou null s'il n'y en a pas.

export function useOpenDriverAlert() {
  const fetchAlert = useCallback(
    (signal) =>
      getDriverAlerts({ statuses: ['ouverte', 'prise_en_charge'], per_page: 1 }, { signal }).then(
        (response) => response.data[0] ?? null,
      ),
    [],
  )
  const alert = useApi(fetchAlert)
  useAutoRefresh(alert.reload)
  return alert
}
