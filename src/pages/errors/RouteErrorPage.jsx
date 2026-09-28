import { TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '../../components/ui/Button'
import { MessagePage } from '../../components/ui/MessagePage'
import { NotFoundPage } from './NotFoundPage'

// Filet de sécurité quand un composant plante pendant le rendu
export function RouteErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  if (import.meta.env.DEV) console.error(error)

  return (
    <MessagePage
      icon={TriangleAlert}
      title="Une erreur est survenue"
      fullScreen
      actions={
        <Button onClick={() => window.location.reload()}>Recharger la page</Button>
      }
    >
      <p>La page n’a pas pu s’afficher. Rechargez-la ou réessayez plus tard.</p>
    </MessagePage>
  )
}
