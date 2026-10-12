import { Download } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { downloadMyPersonalData } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'
import { getBlobErrorMessage, saveBlob } from '../../lib/documents'
import { personalDataFileName } from '../../lib/privacy'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

// Section « Mes données » de /compte (RGPD, accès et portabilité) : télécharge toutes les données du compte en JSON
// (GET /auth/me/personal-data). L'effacement passe par la commune (anonymisation par un admin).
export function PersonalDataCard() {
  const { user, hasRole } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      saveBlob(await downloadMyPersonalData(), personalDataFileName(user.id))
    } catch (err) {
      setError(await getBlobErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card as="section" id="donnees" aria-labelledby="personal-data-title" className="scroll-mt-6">
      <h2 id="personal-data-title" className="text-[17px] font-bold">
        Mes données
      </h2>
      <p className="mt-1 text-sm text-muted">
        Une copie de toutes les données que l’application garde sur vous (compte, organisations, réservations demandées,
        notifications{hasRole('chauffeur') ? ', missions et positions envoyées' : ''}), dans un fichier JSON.
      </p>
      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}
      <div className="mt-4">
        <Button variant="secondary" loading={downloading} onClick={handleDownload}>
          <Download className="size-4" aria-hidden="true" /> Télécharger mes données
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted">
        Pour faire effacer votre compte, adressez-vous à la commune : voir la{' '}
        <Link to="/confidentialite" className="font-semibold text-link hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </Card>
  )
}
