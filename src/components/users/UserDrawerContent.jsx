import { Link } from 'react-router'
import { NEW_USER } from '../../lib/users'
import { Alert } from '../ui/Alert'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { UserContext } from './UserContext'
import { UserCreateForm } from './UserCreateForm'
import { UserInfoForm } from './UserInfoForm'
import { UserPasswordControl } from './UserPasswordControl'
import { UserRolesForm } from './UserRolesForm'
import { UserStatusControl } from './UserStatusControl'

// Contenu du panneau latéral selon ?utilisateur= : création, ou compte (informations, rôles, rattachements, accès).
// `opened` : { user, loading, error, reload } — le compte vient de la liste, sinon de GET /users/{id}.
// `notice` : message à afficher en tête (ex. après la création). `self` : compte de l'admin connecté.
// `canSendResetLink` : permission users.send-password-reset (section « Mot de passe »).
// `canUseTools` : permission tooling.access (lien vers le diagnostic du compte dans Outils).
export function UserDrawerContent({
  userParam,
  opened,
  self,
  notice,
  canSeeDrivers,
  canSendResetLink,
  canUseTools,
  onCreated,
  onSaved,
  onStatusChanged,
}) {
  if (userParam === NEW_USER) return <UserCreateForm onCreated={onCreated} />

  if (opened.error) return <ErrorState error={opened.error} onRetry={opened.reload} />
  if (!opened.user) return opened.loading ? <Loader /> : <Alert tone="warning">Ce compte est introuvable.</Alert>

  const { user } = opened
  return (
    <>
      {notice && <Alert tone="success">{notice}</Alert>}

      <section className="grid gap-3">
        <h3 className="font-bold">Informations</h3>
        <UserInfoForm key={`info-${user.id}-${user.updated_at}`} user={user} onSaved={onSaved} />
      </section>

      <section className="grid gap-3 border-t border-line pt-5">
        <h3 className="font-bold">Rôles</h3>
        <UserRolesForm key={`roles-${user.id}-${user.roles.join()}`} user={user} self={self} onSaved={onSaved} />
      </section>

      <UserContext user={user} canSeeDrivers={canSeeDrivers} />

      {canSendResetLink && <UserPasswordControl key={`password-${user.id}`} user={user} self={self} />}

      <UserStatusControl user={user} self={self} onChanged={onStatusChanged} />

      {canUseTools && (
        <p className="border-t border-line pt-5 text-sm">
          <Link to={`/gestion/outils?onglet=comptes&utilisateur=${user.id}`} className="font-semibold text-link hover:underline">
            Diagnostic du compte
          </Link>
          <span className="text-muted"> : permissions effectives et dernières actions.</span>
        </p>
      )}
    </>
  )
}
