import { getDriverJourneySettings } from '../api/driverJourney'
import { DEFAULT_NAVIGATION_ENGINE } from '../lib/navigation'
import { useApi } from './useApi'

function fetchSettings(signal) {
  return getDriverJourneySettings({ signal })
}

// Application de navigation de la commune. En attendant la réponse (ou si elle échoue), le moteur par défaut :
// les boutons d'itinéraire restent utilisables tout de suite.
export function useNavigationEngine() {
  const settings = useApi(fetchSettings)
  return settings.data?.navigation_engine ?? DEFAULT_NAVIGATION_ENGINE
}
