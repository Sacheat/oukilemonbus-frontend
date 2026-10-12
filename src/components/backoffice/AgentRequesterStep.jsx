import { ArrowRight, Building2 } from 'lucide-react'
import { useCallback } from 'react'
import { getOrganization, getOrganizationMembers } from '../../api/organizations'
import { useAuth } from '../../auth/useAuth'
import { useApi } from '../../hooks/useApi'
import { organizationBlocker, requesterOptions } from '../../lib/agentBooking'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Field, Select } from '../ui/Field'
import { Loader } from '../ui/Loader'
import { OrganizationFilter } from './OrganizationFilter'

// Étape « Pour qui ? » d'une réservation ou d'une série encodée par un agent : organisation (recherche côté backend),
// puis demandeur parmi ses membres (vide = l'agent). `series` : seules les écoles et le personnel communal.
// `onContinue({ organization, members, requesterId })` quand le choix est valable.
export function AgentRequesterStep({ series = false, organizationId, requesterId, onOrganizationChange, onRequesterChange, onContinue, onCancel }) {
  const { user } = useAuth()
  const fetchOrganization = useCallback(
    async (signal) => {
      if (!organizationId) return null
      const [organization, members] = await Promise.all([
        getOrganization(organizationId, { signal }),
        getOrganizationMembers(organizationId, { signal }),
      ])
      return { organization, members }
    },
    [organizationId],
  )
  const chosen = useApi(fetchOrganization)
  const organization = chosen.data?.organization ?? null
  const members = chosen.data?.members ?? []
  const blocker = organizationBlocker(organization, { series })

  return (
    <Card as="section" aria-labelledby="pour-qui" className="grid gap-5 p-5 sm:p-7">
      <div>
        <h2 id="pour-qui" className="text-[21px] font-bold">
          Pour qui ?
        </h2>
        <p className="mt-1 text-sm text-muted">
          {series
            ? 'Choisissez l’école ou le service communal, puis la personne qui a fait la demande.'
            : 'Choisissez l’organisation, puis la personne qui a fait la demande : elle sera prévenue et suivra la réservation dans son espace.'}
        </p>
      </div>

      <Field label="Organisation" required hint="Tapez au moins 2 lettres du nom.">
        {() => (
          <OrganizationFilter
            ariaLabel="Organisation de la réservation"
            value={organizationId}
            onChange={(id) => {
              onOrganizationChange(id ? String(id) : '')
              onRequesterChange('')
            }}
          />
        )}
      </Field>

      {organizationId && chosen.error && <Alert tone="danger">{getErrorMessage(chosen.error)}</Alert>}
      {organizationId && !chosen.error && !chosen.data && <Loader />}
      {blocker && <Alert tone="warning">{blocker}</Alert>}

      {organization && !blocker && (
        <Field
          label="Demandeur"
          hint={members.length === 0 ? 'Cette organisation n’a encore aucun membre : la demande sera à votre nom.' : 'Il reçoit les notifications de la demande.'}
        >
          {(props) => (
            <Select {...props} value={requesterId} onChange={(event) => onRequesterChange(event.target.value)}>
              {requesterOptions(members, user).map((option) => (
                <option key={option.value || 'agent'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={!organization || Boolean(blocker)} onClick={() => onContinue({ organization, members, requesterId })}>
          <Building2 className="size-4" aria-hidden="true" />
          Continuer vers le trajet
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}
