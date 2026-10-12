import { UserSearch } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useInspectorUser } from '../../hooks/useInspectorUser'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { AccountSearch } from './AccountSearch'
import { AccountSheet } from './AccountSheet'

// Onglet Comptes : recherche d'un compte puis sa fiche de diagnostic (?utilisateur=id, aussi ouvert depuis le
// panneau de la page Utilisateurs ou depuis une entrée du journal) ; sans compte choisi, un message dit quoi faire
export function AccountsTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = /^\d+$/.test(searchParams.get('utilisateur') ?? '') ? searchParams.get('utilisateur') : null
  const account = useInspectorUser(userId)

  function select(user) {
    const next = new URLSearchParams(searchParams)
    next.set('utilisateur', String(user.id))
    setSearchParams(next)
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm text-muted">
          Pourquoi un compte ne voit-il pas un menu ou reçoit-il un refus ? Sa fiche montre ses rôles, ses permissions
          effectives et ses dernières actions.
        </p>
        <AccountSearch onSelect={select} />
      </div>
      {!userId ? (
        <EmptyState icon={UserSearch} title="Aucun compte choisi">
          Cherchez un compte ci-dessus, ou ouvrez « Diagnostic du compte » depuis la page Utilisateurs.
        </EmptyState>
      ) : account.error ? (
        <ErrorState error={account.error} onRetry={account.reload} />
      ) : account.sheet ? (
        <AccountSheet sheet={account.sheet} />
      ) : (
        <Loader />
      )}
    </div>
  )
}
