import { ArrowRight, Building2, CircleCheck, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { KeyFacts } from '../../components/reservations/KeyFacts'
import { TripHero } from '../../components/reservations/TripHero'
import { TripProgress } from '../../components/reservations/TripProgress'
import { ReservationWizard } from '../../components/reservations/wizard/ReservationWizard'
import { StepIndicator } from '../../components/reservations/wizard/StepIndicator'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { clearDraft, loadDraft } from '../../lib/drafts'
import { EMPTY_RESERVATION } from '../../lib/reservationForm'
import { statusHint, todayApiDate } from '../../lib/reservations'

const DRAFT_NAME = 'new-reservation'

// Organisations pour lesquelles on peut réserver (non bannies)
function bookableOrganizations(user) {
  return (user.organizations ?? []).filter((organization) => !organization.is_banned)
}

function freshValues(organizations) {
  const preferred =
    organizations.find((organization) => organization.membership?.is_default) ??
    (organizations.length === 1 ? organizations[0] : null)
  return { ...EMPTY_RESERVATION, organization_id: preferred ? String(preferred.id) : '' }
}

// État initial : brouillon de l'utilisateur s'il existe (sans date passée), sinon formulaire vierge
function initialState(user, organizations) {
  const draft = loadDraft(DRAFT_NAME, user.id)
  if (!draft) return { values: freshValues(organizations), step: 1, idempotency: null, restored: false }
  const values = { ...EMPTY_RESERVATION, ...draft.values }
  if (values.trip_date && values.trip_date < todayApiDate()) values.trip_date = ''
  if (!organizations.some((organization) => String(organization.id) === String(values.organization_id))) {
    values.organization_id = freshValues(organizations).organization_id
  }
  // Le preview de l'étape 3 est relancé à la main : on reprend au plus à l'étape 2
  return { values, step: Math.min(draft.step ?? 1, 2), idempotency: draft.idempotency ?? null, restored: true }
}

// Nouvelle réservation (maquette 03 : réservation guidée en 4 étapes)
export function NewReservationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const organizations = bookableOrganizations(user)
  // Change à chaque « recommencer » pour repartir d'un assistant neuf
  const [attempt, setAttempt] = useState(0)
  const [initial, setInitial] = useState(() => initialState(user, organizations))
  const [created, setCreated] = useState(null)
  const headingRef = useRef(null)

  useEffect(() => {
    if (created) headingRef.current?.focus()
  }, [created])

  function restart() {
    clearDraft(DRAFT_NAME)
    setInitial({ values: freshValues(organizations), step: 1, idempotency: null, restored: false })
    setCreated(null)
    setAttempt((count) => count + 1)
    window.scrollTo({ top: 0 })
  }

  if (organizations.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Nouvelle réservation" title="Commençons par votre trajet" />
        <EmptyState
          icon={Building2}
          title="Aucune organisation pour réserver"
          actions={<Button to="/espace/organisations">Rejoindre ou créer une organisation</Button>}
        >
          Les réservations se font au nom d’une organisation dont vous êtes membre.
        </EmptyState>
      </>
    )
  }

  if (created) {
    return (
      <>
        <PageHeader eyebrow="Nouvelle réservation" title="Demande envoyée" />
        <StepIndicator current={4} />
        <div className="grid gap-5">
          <div className="flex items-start gap-3">
            <CircleCheck className="mt-0.5 size-7 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
                Votre demande a bien été envoyée
              </h2>
              <p className="mt-0.5 text-muted">{statusHint(created)}</p>
            </div>
          </div>

          <TripHero reservation={created} eyebrow="Votre demande" titleAs="h3">
            <Button variant="accent" to={`/espace/deplacements/${created.id}`}>
              Voir le détail <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" onClick={restart}>
              <Plus className="size-4" aria-hidden="true" /> Nouvelle réservation
            </Button>
          </TripHero>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <Panel title="Et maintenant ?">
              <div className="p-5">
                <TripProgress reservation={created} />
              </div>
            </Panel>
            <KeyFacts reservation={created} className="grid-cols-2" />
          </div>

          <div>
            <Button variant="link" to="/espace/deplacements">
              Voir tous mes déplacements
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <ReservationWizard
      key={attempt}
      mode="create"
      initial={initial}
      organizations={organizations}
      draft={{ name: DRAFT_NAME, userId: user.id }}
      onDone={(reservation) => {
        setCreated(reservation)
        window.scrollTo({ top: 0 })
      }}
      onCancel={() => navigate('/espace/deplacements')}
      onRestart={restart}
    />
  )
}
