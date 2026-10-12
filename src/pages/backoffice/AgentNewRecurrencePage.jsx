import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { AgentRequesterStep } from '../../components/backoffice/AgentRequesterStep'
import { RecurrenceWizard } from '../../components/recurrences/wizard/RecurrenceWizard'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { requesterName } from '../../lib/agentBooking'
import { EMPTY_RECURRENCE } from '../../lib/recurrences'

const QUEUE = '/gestion/reservations'

// Nouvelle série encodée par un agent ou un admin (écoles et personnel communal) : « Pour qui ? », puis l'assistant
// de série, sans le préavis de 15 jours. Après la création : retour à la file avec le bilan (trajets créés, dates
// ignorées ou en échec).
export function AgentNewRecurrencePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [organizationId, setOrganizationId] = useState('')
  const [requesterId, setRequesterId] = useState('')
  const [chosen, setChosen] = useState(null)

  const backLink = (
    <Link to={QUEUE} className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Retour à la file
    </Link>
  )

  if (!chosen) {
    return (
      <div className="grid gap-5">
        <div>{backLink}</div>
        <PageHeader eyebrow="Nouvelle série (gestion)" title="Pour qui est la série ?" description="Trajets réguliers d’une école ou d’un service communal." />
        <AgentRequesterStep
          series
          organizationId={organizationId}
          requesterId={requesterId}
          onOrganizationChange={setOrganizationId}
          onRequesterChange={setRequesterId}
          onContinue={setChosen}
          onCancel={() => navigate(QUEUE)}
        />
      </div>
    )
  }

  const requester = requesterName(chosen.members, chosen.requesterId, user)

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {backLink}
        <p className="text-sm text-muted">
          Pour <strong className="text-ink">{chosen.organization.name}</strong>, au nom de {requester}.{' '}
          <Button variant="link" className="text-sm" onClick={() => setChosen(null)}>
            Changer
          </Button>
        </p>
      </div>
      <RecurrenceWizard
        agent
        requestedByUserId={chosen.requesterId || null}
        initial={{ values: { ...EMPTY_RECURRENCE, organization_id: String(chosen.organization.id) } }}
        organizations={[chosen.organization]}
        onDone={({ report }) => {
          const skipped = (report?.skipped_dates?.length ?? 0) + (report?.failed_dates?.length ?? 0)
          navigate(QUEUE, {
            state: {
              notice: `Série créée pour ${chosen.organization.name} : ${report?.created_count ?? 0} trajet(s)${skipped ? `, ${skipped} date(s) non retenue(s)` : ''}.`,
            },
          })
        }}
        onCancel={() => setChosen(null)}
      />
    </>
  )
}
