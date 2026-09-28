import { Compass } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { MessagePage } from '../../components/ui/MessagePage'

export function NotFoundPage() {
  return (
    <MessagePage icon={Compass} title="Page introuvable" fullScreen actions={<Button to="/">Retour à l’accueil</Button>}>
      <p>Cette page n’existe pas ou a été déplacée.</p>
    </MessagePage>
  )
}
