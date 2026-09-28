import { getErrorMessage } from '../../lib/errors'
import { Alert } from './Alert'
import { Button } from './Button'

// Erreur de chargement avec bouton pour réessayer
export function ErrorState({ error, onRetry, className }) {
  return (
    <Alert tone="danger" title="Chargement impossible" className={className}>
      <p>{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="link" onClick={onRetry} className="mt-1 text-sm">
          Réessayer
        </Button>
      )}
    </Alert>
  )
}
