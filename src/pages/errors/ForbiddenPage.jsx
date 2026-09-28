import { ShieldAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { MessagePage } from '../../components/ui/MessagePage'

export function ForbiddenPage({ fullScreen = false }) {
  return (
    <MessagePage
      icon={ShieldAlert}
      title="Accès refusé"
      fullScreen={fullScreen}
      actions={<Button to="/">Retour à mon espace</Button>}
    >
      <p>Vous n’avez pas les droits nécessaires pour afficher cette page.</p>
    </MessagePage>
  )
}
