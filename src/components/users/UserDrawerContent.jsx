import { Link } from 'react-router'
import { formatDateTime } from '../../lib/dates'
import { isAnonymized } from '../../lib/privacy'
import { NEW_USER } from '../../lib/users'
import { Alert } from '../ui/Alert'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { UserContext } from './UserContext'
import { UserCreateForm } from './UserCreateForm'
import { UserInfoForm } from './UserInfoForm'
import { UserPasswordControl } from './UserPasswordControl'
import { UserPrivacyControl } from './UserPrivacyControl'
import { UserRolesForm } from './UserRolesForm'
import { UserStatusControl } from './UserStatusControl'
import { UserSummary } from './UserSummary'

// Contenu du panneau latéral selon ?utilisateur= : création, ou compte (informations, rôles, rattachements, accès).
// `opened` : { user, loading, error, reload } — le compte vient de la liste, sinon de GET /users/{id}.
// `notice` : message à afficher en tête (après la création ou un enregistrement). `self` : compte de l'admin connecté.
// `canSeeDrivers` / `canSeeOrganizations` : liens vers la fiche chauffeur et les organisations.
// `canSendResetLink` : permission users.send-password-reset (section « Mot de passe »).
// `canUseTools` : permission tooling.access (lien vers le diagnostic du compte dans Outils).
// `canExportData` / `canAnonymize` : permissions users.export-data et users.anonymize (section RGPD).
// Compte anonymisé : en-tête et explication seulement.
export function UserDrawerContent({
  userParam,
  opened,
  self,
  notice,
  canSeeDrivers,
  canSeeOrganizations,
  canSendResetLink,
  canUseTools,
  canExportData,
  canAnonymize,
  onCreated,
  onInfoSaved,
  onRolesSaved,
  onStatusChanged,
  onAnonymized,
}) {
  if (userParam === NEW_USER) return <UserCreateForm onCreated={onCreated} />

  if (opened.error) return <ErrorState error={opened.error} onRetry={opened.reload} />
  if (!opened.user) return opened.loading ? <Loader /> : <Alert tone="warning">Ce compte est introuvable.</Alert>

  const { user } = opened
  const diagnosticLink = canUseTools && (
    <p className="border-t border-line pt-5 text-sm">
      <Link to={`/gestion/outils?onglet=comptes&utilisateur=${user.id}`} className="font-semibold text-link hover:underline">
        Diagnostic du compte
      </Link>
      <span className="text-muted"> : permissions effectives et dernières actions.</span>
    </p>
  )

  // Compte anonymisé (RGPD) : plus rien à modifier, ni à réactiver
  if (isAnonymized(user)) {
    return (
      <>
        {notice && <Alert tone="success">{notice}</Alert>}
        <UserSummary user={user} />
        <Alert tone="info">
          Compte anonymisé le {formatDateTime(user.anonymized_at)} à la demande de la personne : son identité est effacée et
          il ne peut plus être modifié ni réactivé. Ses réservations et documents officiels sont conservés.
        </Alert>
        {diagnosticLink}
      </>
    )
  }

  return (
    <>
      {notice && <Alert tone="success">{notice}</Alert>}

      <UserSummary user={user} />

      <section className="grid gap-3">
        <h3 className="font-bold">Informations</h3>
        <UserInfoForm key={`info-${user.id}-${user.updated_at}`} user={user} onSaved={onInfoSaved} />
      </section>

      <section className="grid gap-3 border-t border-line pt-5">
        <h3 className="font-bold">Rôles</h3>
        <UserRolesForm
          key={`roles-${user.id}-${user.roles.join()}`}
          user={user}
          self={self}
          canSeeDrivers={canSeeDrivers}
          onSaved={onRolesSaved}
        />
      </section>

      <UserContext user={user} canSeeDrivers={canSeeDrivers} canSeeOrganizations={canSeeOrganizations} />

      {canSendResetLink && <UserPasswordControl key={`password-${user.id}`} user={user} self={self} />}

      <UserStatusControl user={user} self={self} onChanged={onStatusChanged} />

      <UserPrivacyControl
        key={`privacy-${user.id}`}
        user={user}
        self={self}
        canExport={canExportData}
        canAnonymize={canAnonymize}
        onAnonymized={onAnonymized}
      />

      {diagnosticLink}
    </>
  )
}
