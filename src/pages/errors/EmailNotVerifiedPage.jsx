import { Hourglass } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { ResendVerificationButton } from '../../components/ResendVerificationButton'
import { MessagePage } from '../../components/ui/MessagePage'
import { UserMenu } from '../../layouts/UserMenu'

export function EmailNotVerifiedPage() {
  const { user } = useAuth()
  return (
    <MessagePage
      icon={Hourglass}
      title="Vérifiez votre adresse e-mail"
      fullScreen
      actions={
        <div className="grid w-full justify-items-center gap-4">
          <ResendVerificationButton />
          <UserMenu />
        </div>
      }
    >
      <p>
        Un lien de vérification a été envoyé à <strong className="text-ink">{user.email}</strong>. Il peut mettre quelques
        instants à arriver. Ouvrez-le pour accéder à votre espace, et pensez à vérifier vos courriers indésirables.
      </p>
    </MessagePage>
  )
}
