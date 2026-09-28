import { Hourglass } from 'lucide-react'
import { MessagePage } from '../../components/ui/MessagePage'
import { UserMenu } from '../../layouts/UserMenu'

// Version minimale : le renvoi de l'email de vérification arrive avec le bloc Auth
export function EmailNotVerifiedPage() {
  return (
    <MessagePage icon={Hourglass} title="Vérifiez votre adresse e-mail" fullScreen actions={<UserMenu />}>
      <p>Un lien de vérification vous a été envoyé par e-mail. Ouvrez-le pour accéder à votre espace.</p>
    </MessagePage>
  )
}
