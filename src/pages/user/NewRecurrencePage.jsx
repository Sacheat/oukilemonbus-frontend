import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { CreationReport } from '../../components/recurrences/CreationReport'
import { RecurrenceWizard } from '../../components/recurrences/wizard/RecurrenceWizard'
import { StepIndicator } from '../../components/reservations/wizard/StepIndicator'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { clearDraft, loadDraft } from '../../lib/drafts'
import { EMPTY_RECURRENCE, recurrenceOrganizations } from '../../lib/recurrences'
import { todayApiDate } from '../../lib/reservations'

const DRAFT_NAME = 'new-recurrence'
const STEPS = ['Trajet', 'Calendrier', 'Passagers', 'Vérification']

// Organisations pour lesquelles on peut créer une série : écoles et personnel communal, non bannies
function eligibleOrganizations(user) {
  return recurrenceOrganizations(user).filter((organization) => !organization.is_banned)
}

function freshValues(organizations) {
  const preferred =
    organizations.find((organization) => organization.membership?.is_default) ??
    (organizations.length === 1 ? organizations[0] : null)
  return { ...EMPTY_RECURRENCE, organization_id: preferred ? String(preferred.id) : '' }
}

// État initial : brouillon de l'utilisateur s'il existe (sans date passée), sinon formulaire vierge
function initialState(user, organizations) {
  const draft = loadDraft(DRAFT_NAME, user.id)
  if (!draft) return { values: freshValues(organizations), step: 1, idempotency: null, restored: false }
  const values = { ...EMPTY_RECURRENCE, ...draft.values }
  if (values.start_date && values.start_date < todayApiDate()) values.start_date = ''
  if (values.end_date && values.end_date < todayApiDate()) values.end_date = ''
  if (!organizations.some((organization) => String(organization.id) === String(values.organization_id))) {
    values.organization_id = freshValues(organizations).organization_id
  }
  // L'aperçu final de l'étape 4 est relancé à la main : on reprend au plus à l'étape 3
  return { values, step: Math.min(draft.step ?? 1, 3), idempotency: draft.idempotency ?? null, restored: true }
}

// Nouvelle récurrence : assistant en 4 étapes puis rapport de création
export function NewRecurrencePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const organizations = eligibleOrganizations(user)
  // Change à chaque « recommencer » pour repartir d'un assistant neuf
  const [attempt, setAttempt] = useState(0)
  const [initial, setInitial] = useState(() => initialState(user, organizations))
  const [created, setCreated] = useState(null)

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
        <PageHeader eyebrow="Nouvelle récurrence" title="Commençons par le trajet" />
        <EmptyState
          icon={Building2}
          title="Aucune organisation pour créer une série"
          actions={<Button to="/espace/recurrences">Retour aux récurrences</Button>}
        >
          Les récurrences sont réservées aux écoles communales et au personnel communal.
        </EmptyState>
      </>
    )
  }

  if (created) {
    return (
      <>
        <PageHeader eyebrow="Nouvelle récurrence" title="Série envoyée" />
        <StepIndicator current={5} steps={STEPS} />
        <CreationReport recurrence={created.recurrence} report={created.report} onRestart={restart} />
      </>
    )
  }

  return (
    <RecurrenceWizard
      key={attempt}
      initial={initial}
      organizations={organizations}
      draft={{ name: DRAFT_NAME, userId: user.id }}
      onDone={(result) => {
        setCreated(result)
        window.scrollTo({ top: 0 })
      }}
      onCancel={() => navigate('/espace/recurrences')}
      onRestart={restart}
    />
  )
}
