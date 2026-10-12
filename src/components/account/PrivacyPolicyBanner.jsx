import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { acceptPrivacyPolicy } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../lib/errors'
import { mustReadPrivacyPolicy } from '../../lib/privacy'
import { Button } from '../ui/Button'

// Bandeau en haut des espaces connectés quand la politique de confidentialité est à lire (`privacy_policy.must_accept` :
// compte antérieur, créé par un admin, ou nouvelle version). Ce n'est pas un consentement : rien n'est bloqué.
// « J'ai lu » enregistre la version (POST /auth/me/privacy-policy) puis relit le compte ; une page périmée (422)
// relit simplement le compte pour proposer la bonne version.
export function PrivacyPolicyBanner() {
  const { user, refresh } = useAuth()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  if (!mustReadPrivacyPolicy(user)) return null

  async function handleRead() {
    setSending(true)
    setError(null)
    try {
      await acceptPrivacyPolicy(user.privacy_policy.version)
      await refresh()
    } catch (err) {
      setError(getErrorMessage(err))
      await refresh().catch(() => {})
    } finally {
      setSending(false)
    }
  }

  return (
    <div role="region" aria-label="Politique de confidentialité" className="border-b border-line bg-info-soft px-5 py-3 sm:px-8">
      <div className="mx-auto flex max-w-[1050px] flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <ShieldCheck className="size-5 shrink-0 text-info" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          {user.privacy_policy.accepted_version
            ? 'La politique de confidentialité a été mise à jour.'
            : 'Prenez connaissance de la politique de confidentialité.'}{' '}
          <Link to="/confidentialite" target="_blank" className="font-bold text-link hover:underline">
            La lire
          </Link>{' '}
          (nouvel onglet).
          {error && <span className="block font-semibold text-danger">{error}</span>}
        </p>
        <Button variant="secondary" className="text-sm" loading={sending} onClick={handleRead}>
          J’ai lu
        </Button>
      </div>
    </div>
  )
}
