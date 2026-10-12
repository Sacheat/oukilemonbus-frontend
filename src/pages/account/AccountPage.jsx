import { BadgeCheck, Bell, Circle, CircleCheck, Compass, KeyRound, UserRound } from 'lucide-react'
import { useState } from 'react'
import { updatePassword, updateProfile } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import { NotificationPreferencesCard } from '../../components/notifications/NotificationPreferencesCard'
import { OrganizationAvatar } from '../../components/organizations/OrganizationAvatar'
import { ResendVerificationButton } from '../../components/ResendVerificationButton'
import { ToursCard } from '../../components/tour/ToursCard'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, PasswordInput } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useForm } from '../../hooks/useForm'
import { cx } from '../../lib/cx'
import { ROLE_LABELS } from '../../lib/labels'

const SECTIONS = [
  { id: 'informations', label: 'Informations', icon: UserRound },
  { id: 'securite', label: 'Sécurité', icon: KeyRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'tutoriels', label: 'Tutoriels', icon: Compass },
]

// Mon compte : en-tête de profil, puis les sections Informations, Sécurité, Notifications et Tutoriels,
// avec un sommaire à gauche en grand écran qui suit la section visible
export function AccountPage() {
  const active = useActiveSection(SECTIONS.map((section) => section.id))
  return (
    <>
      <PageHeader eyebrow="Mon compte" title="Mon compte" description="Vos coordonnées, votre mot de passe, vos notifications et les tutoriels." />
      <ProfileHeader />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Sections du compte" className="hidden lg:sticky lg:top-6 lg:block">
          <ul className="grid gap-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? 'true' : undefined}
                  className={cx(
                    'flex min-h-11 items-center gap-2.5 rounded-control px-3 text-sm font-semibold',
                    active === id ? 'bg-soft text-link' : 'text-muted hover:bg-surface hover:text-ink',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-5">
          <ProfileForm />
          <PasswordForm />
          <NotificationPreferencesCard />
          <ToursCard />
        </div>
      </div>
    </>
  )
}

// En-tête de profil : initiales, nom, e-mail (vérifié ou non, avec renvoi du lien), rôle, organisations
function ProfileHeader() {
  const { user } = useAuth()
  const roles = (user.roles ?? []).map((name) => ROLE_LABELS[name] ?? name)
  const organizations = user.organizations?.length ?? 0
  const since = new Intl.DateTimeFormat('fr-BE', { month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' }).format(
    new Date(user.created_at),
  )

  return (
    <Card as="section" aria-label="Profil" className="flex flex-wrap items-center gap-5">
      <OrganizationAvatar name={user.full_name} className="size-16 rounded-full text-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold break-words">{user.full_name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
          <span className="break-all text-muted">{user.email}</span>
          {user.email_verified_at ? (
            <Badge tone="success">
              <BadgeCheck className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
              Vérifié
            </Badge>
          ) : (
            <Badge tone="warning">Non vérifié</Badge>
          )}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
          {roles.map((role) => (
            <Badge key={role} tone="info">
              {role}
            </Badge>
          ))}
          <span>
            {organizations > 0 && `${organizations} organisation${organizations > 1 ? 's' : ''} · `}
            Inscrit depuis {since}
          </span>
        </p>
      </div>
      {!user.email_verified_at && (
        <div className="w-full sm:w-auto">
          <ResendVerificationButton variant="secondary" />
        </div>
      )}
    </Card>
  )
}

function ProfileForm() {
  const { user, refresh } = useAuth()
  const [saved, setSaved] = useState(false)
  const form = useForm({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone ?? '',
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    const result = await form.submit((values) => updateProfile(user.id, values))
    if (result.ok) {
      setSaved(true)
      await refresh() // met à jour le nom affiché dans l'en-tête
    }
  }

  return (
    <Card as="section" id="informations" aria-labelledby="profile-title" className="scroll-mt-6">
      <h2 id="profile-title" className="text-[17px] font-bold">
        Informations
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        {saved && (
          <Alert tone="success" className="sm:col-span-2">
            Vos informations ont été enregistrées.
          </Alert>
        )}
        {form.error && (
          <Alert tone="danger" className="sm:col-span-2">
            {form.error}
          </Alert>
        )}

        <Field label="Prénom" required error={form.errors.first_name}>
          {(props) => (
            <Input {...props} autoComplete="given-name" value={form.values.first_name} onChange={form.handle('first_name')} />
          )}
        </Field>
        <Field label="Nom" required error={form.errors.last_name}>
          {(props) => (
            <Input {...props} autoComplete="family-name" value={form.values.last_name} onChange={form.handle('last_name')} />
          )}
        </Field>
        <Field label="Adresse e-mail" required error={form.errors.email} className="sm:col-span-2">
          {(props) => (
            <Input {...props} type="email" autoComplete="email" value={form.values.email} onChange={form.handle('email')} />
          )}
        </Field>
        <Field label="Téléphone" hint="Facultatif." error={form.errors.phone} className="sm:col-span-2">
          {(props) => <Input {...props} type="tel" autoComplete="tel" value={form.values.phone} onChange={form.handle('phone')} />}
        </Field>

        <div className="sm:col-span-2">
          <Button type="submit" loading={form.submitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}

const EMPTY_PASSWORDS = { current_password: '', password: '', password_confirmation: '' }

// Règles du nouveau mot de passe, affichées en direct sous les champs
function passwordRules({ password, password_confirmation: confirmation }) {
  return [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Confirmation identique', ok: confirmation !== '' && confirmation === password },
  ]
}

function PasswordForm() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const form = useForm(EMPTY_PASSWORDS)

  // La session en cours reste valide ; le backend ferme les sessions des autres appareils
  async function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    const result = await form.submit((values) => updatePassword(user.id, values))
    if (result.ok) {
      form.setValues(EMPTY_PASSWORDS)
      setSaved(true)
    }
  }

  return (
    <Card as="section" id="securite" aria-labelledby="password-title" className="scroll-mt-6">
      <h2 id="password-title" className="text-[17px] font-bold">
        Sécurité
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4">
        <p className="text-sm text-muted">Vos autres appareils seront déconnectés ; cette session reste ouverte.</p>
        {saved && <Alert tone="success">Votre mot de passe a été modifié.</Alert>}
        {form.error && <Alert tone="danger">{form.error}</Alert>}

        <Field label="Mot de passe actuel" required error={form.errors.current_password}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="current-password"
              value={form.values.current_password}
              onChange={form.handle('current_password')}
            />
          )}
        </Field>
        <Field label="Nouveau mot de passe" required error={form.errors.password}>
          {(props) => (
            <PasswordInput {...props} autoComplete="new-password" value={form.values.password} onChange={form.handle('password')} />
          )}
        </Field>
        <Field label="Confirmation" required error={form.errors.password_confirmation}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              value={form.values.password_confirmation}
              onChange={form.handle('password_confirmation')}
            />
          )}
        </Field>

        {/* Règles vérifiées en direct (le backend reste l'autorité) */}
        <ul aria-live="polite" className="grid gap-1 text-sm">
          {passwordRules(form.values).map((rule) => (
            <li key={rule.label} className={cx('flex items-center gap-2', rule.ok ? 'text-success' : 'text-muted')}>
              {rule.ok ? <CircleCheck className="size-4" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
              {rule.label}
              <span className="sr-only">{rule.ok ? ' : respecté' : ' : pas encore'}</span>
            </li>
          ))}
        </ul>

        <div>
          <Button type="submit" loading={form.submitting}>
            Modifier le mot de passe
          </Button>
        </div>
      </form>
    </Card>
  )
}
