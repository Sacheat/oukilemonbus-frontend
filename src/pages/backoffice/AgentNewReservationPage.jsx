import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { AgentRequesterStep } from '../../components/backoffice/AgentRequesterStep'
import { ReservationWizard } from '../../components/reservations/wizard/ReservationWizard'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { requesterName } from '../../lib/agentBooking'
import { EMPTY_RESERVATION } from '../../lib/reservationForm'

const QUEUE = '/gestion/reservations'

// Nouvelle réservation encodée par un agent ou un admin (demande téléphonée) :
//   1. « Pour qui ? » : organisation (recherche) et demandeur parmi ses membres (l'agent par défaut)
//   2. l'assistant habituel en mode agent : sans le préavis de 15 jours (noté dans l'historique par le backend)
// Après la création : retour à la file, réservation ouverte et message.
export function AgentNewReservationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [organizationId, setOrganizationId] = useState('')
  const [requesterId, setRequesterId] = useState('')
  const [chosen, setChosen] = useState(null) // { organization, members, requesterId } une fois « Pour qui ? » validé

  const backLink = (
    <Link to={QUEUE} className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Retour à la file
    </Link>
  )

  if (!chosen) {
    return (
      <div className="grid gap-5">
        <div>{backLink}</div>
        <PageHeader eyebrow="Nouvelle réservation (gestion)" title="Pour qui est la réservation ?" description="Pour une demande reçue par téléphone ou par email." />
        <AgentRequesterStep
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
      <ReservationWizard
        mode="create"
        agent
        requestedByUserId={chosen.requesterId || null}
        initial={{ values: { ...EMPTY_RESERVATION, organization_id: String(chosen.organization.id) } }}
        organizations={[chosen.organization]}
        onDone={(reservation) =>
          navigate(`${QUEUE}?reservation=${reservation.id}`, {
            state: { notice: `Réservation « ${reservation.trip_purpose} » créée pour ${chosen.organization.name}, au nom de ${requester}.` },
          })
        }
        onCancel={() => setChosen(null)}
      />
    </>
  )
}
