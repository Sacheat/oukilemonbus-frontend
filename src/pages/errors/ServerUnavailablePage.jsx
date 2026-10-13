import { ServerCrash } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/ui/Button'
import { MessagePage } from '../../components/ui/MessagePage'

// La session n'a pas pu être relue (serveur en erreur ou injoignable) : on ne sait pas si l'utilisateur est connecté,
// donc ni page de connexion ni espace. « Réessayer » relance la lecture (chargement plein écran pendant l'appel).
export function ServerUnavailablePage() {
  const { retrySession } = useAuth()

  return (
    <MessagePage
      icon={ServerCrash}
      title="Service momentanément indisponible"
      fullScreen
      actions={<Button onClick={retrySession}>Réessayer</Button>}
    >
      <p>Le serveur ne répond pas correctement. Réessayez dans un instant ; si le problème persiste, prévenez la commune.</p>
    </MessagePage>
  )
}
