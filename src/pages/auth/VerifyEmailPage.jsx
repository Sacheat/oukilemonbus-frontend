import { CircleCheck, CircleX } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { verifyEmail } from '../../api/auth'
import { isEmailVerified } from '../../auth/permissions'
import { useAuth } from '../../auth/useAuth'
import { ResendVerificationButton } from '../../components/ResendVerificationButton'
import { Button } from '../../components/ui/Button'
import { Loader } from '../../components/ui/Loader'
import { useApi } from '../../hooks/useApi'
import { getErrorMessage } from '../../lib/errors'
import { AuthCard } from './AuthCard'

// Ouverte depuis le lien de l'email : {FRONTEND_URL}/verify-email?id=…&hash=…&expires=…&signature=…
// Publique : le lien peut être ouvert sur un autre appareil, sans être connecté.
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const { user, status, refresh } = useAuth()
  const query = searchParams.toString()

  const fetchVerification = useCallback(
    (signal) => {
      const params = Object.fromEntries(new URLSearchParams(query))
      if (!params.id || !params.hash || !params.expires || !params.signature) {
        return Promise.reject(new Error('Lien de vérification incomplet.'))
      }
      return verifyEmail(params, { signal })
    },
    [query],
  )
  const { data: message, error, loading, reload } = useApi(fetchVerification)

  // Utilisateur connecté sur cet appareil : on recharge son profil pour lever le blocage
  useEffect(() => {
    if (message && user && !isEmailVerified(user)) refresh().catch(() => {})
  }, [message, user, refresh])

  if (loading || status === 'loading') {
    return (
      <AuthCard eyebrow="Vérification" title="Vérification de votre adresse…">
        <Loader />
      </AuthCard>
    )
  }

  if (error?.response?.status === 429) {
    return (
      <AuthCard eyebrow="Vérification" title="Trop de tentatives">
        <div className="grid gap-5 text-center">
          <p className="text-muted">{getErrorMessage(error)} Patientez une minute avant de réessayer.</p>
          <Button onClick={reload}>Réessayer</Button>
        </div>
      </AuthCard>
    )
  }

  if (error) {
    return (
      <AuthCard eyebrow="Vérification" title="Lien invalide ou expiré">
        <div className="grid gap-5 text-center">
          <CircleX className="mx-auto size-10 text-danger" aria-hidden="true" />
          {/* 403 : message du backend tel quel ; lien incomplet (pas d'appel au backend) : texte du front */}
          <p className="text-muted">
            {error.response ? getErrorMessage(error) : 'Ce lien de vérification est incomplet. Ouvrez-le à nouveau depuis l’e-mail reçu.'}
          </p>
          {user ? (
            <ResendVerificationButton />
          ) : (
            <>
              <p className="text-sm text-muted">Connectez-vous pour recevoir un nouveau lien.</p>
              <Button to="/connexion">Se connecter</Button>
            </>
          )}
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard eyebrow="Vérification" title="Adresse vérifiée">
      <div className="grid gap-5 text-center">
        <CircleCheck className="mx-auto size-10 text-success" aria-hidden="true" />
        <p className="text-muted">{message}</p>
        {user ? <Button to="/">Accéder à mon espace</Button> : <Button to="/connexion">Se connecter</Button>}
      </div>
    </AuthCard>
  )
}
