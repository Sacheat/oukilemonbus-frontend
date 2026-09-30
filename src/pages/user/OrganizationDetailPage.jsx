import { ArrowLeft, Route } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getOrganization, getOrganizationMembers, getUserOrgRequests } from '../../api/organizations'
import { useAuth } from '../../auth/useAuth'
import { EditMemberRoleModal } from '../../components/organizations/EditMemberRoleModal'
import { MemberRow } from '../../components/organizations/MemberRow'
import { PendingJoinRequest } from '../../components/organizations/PendingJoinRequest'
import { RemoveMemberModal } from '../../components/organizations/RemoveMemberModal'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DetailList } from '../../components/ui/DetailList'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { useApi } from '../../hooks/useApi'
import { ORGANIZATION_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { pendingJoinRequestsFor } from '../../lib/organizations'
import { shortAddress } from '../../lib/reservations'

// Détail d'une de mes organisations : informations, membres et, pour un responsable,
// gestion des membres et demandes d'adhésion en cours (décidées par la commune)
export function OrganizationDetailPage() {
  const { id } = useParams()
  const organizationId = Number(id)
  const { user, isManagerOf } = useAuth()
  const canManage = isManagerOf(organizationId)
  const [dialog, setDialog] = useState(null) // { type: 'role' | 'remove', member }
  const [notice, setNotice] = useState(null)

  const fetchOrganization = useCallback((signal) => getOrganization(id, { signal }), [id])
  const fetchMembers = useCallback((signal) => getOrganizationMembers(id, { signal }), [id])
  const fetchRequests = useCallback(
    (signal) => (canManage ? getUserOrgRequests({}, { signal }).then((page) => page.data) : Promise.resolve([])),
    [canManage],
  )
  const organization = useApi(fetchOrganization)
  const members = useApi(fetchMembers)
  const requests = useApi(fetchRequests)

  function handleRoleSaved(member) {
    setDialog(null)
    setNotice(`Nouveau rôle pour ${member.full_name} : ${RELATIONSHIP_TYPE_LABELS[member.relationship_type]}.`)
    members.reload()
  }

  function handleRemoved(member) {
    setDialog(null)
    setNotice(`${member.full_name} ne fait plus partie de l’organisation.`)
    members.reload()
  }

  const backLink = (
    <Link to="/espace/organisations" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Mes organisations
    </Link>
  )

  if (organization.error) {
    const status = organization.error.response?.status
    return (
      <>
        {backLink}
        {status === 404 || status === 403 ? (
          <Alert tone="danger" title="Organisation introuvable" className="mt-4">
            Cette organisation n’existe pas ou vous n’en faites pas partie.
          </Alert>
        ) : (
          <ErrorState error={organization.error} onRetry={organization.reload} className="mt-4" />
        )}
      </>
    )
  }

  const data = organization.data
  if (!data || (organization.loading && data.id !== organizationId)) return <Loader />

  const pending = pendingJoinRequestsFor(organizationId, user.id, requests.data)
  const membership = user.organizations?.find((item) => item.id === organizationId)?.membership

  return (
    <div className="max-w-4xl">
      {backLink}

      <header className="mt-2 flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">Organisation</p>
          <h1 className="mt-1 text-[27px] leading-tight font-bold tracking-tight">{data.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{data.type_label ?? ORGANIZATION_TYPE_LABELS[data.type]}</span>
            {membership && (
              <Badge tone={membership.is_manager ? 'info' : 'neutral'}>
                {RELATIONSHIP_TYPE_LABELS[membership.relationship_type]}
              </Badge>
            )}
            {data.is_banned && <Badge tone="danger">Bannie</Badge>}
          </div>
        </div>
        <Button variant="secondary" to={`/espace/deplacements?organisation=${organizationId}&periode=tous`}>
          <Route className="size-4" aria-hidden="true" /> Réservations de l’organisation
        </Button>
      </header>

      <div className="grid gap-4">
        {notice && <Alert tone="success">{notice}</Alert>}
        {data.is_banned && (
          <Alert tone="danger" title="Organisation bannie">
            Elle ne peut plus réserver{data.banned_reason ? ` : ${data.banned_reason}` : '.'}
          </Alert>
        )}

        <Card as="section" aria-labelledby="info-title">
          <h2 id="info-title" className="text-[17px] font-bold">
            Informations
          </h2>
          <DetailList
            items={[
              data.official_email && ['E-mail officiel', data.official_email],
              data.phone_contact && ['Téléphone', data.phone_contact],
              data.name_contact && ['Contact', data.name_contact],
              data.location && ['Adresse', shortAddress(data.location)],
              data.is_priority
                ? ['Réservations', 'Approbation automatique, pas de quota annuel']
                : ['Réservations cette année', `${data.reservations_used_this_year} sur ${data.annual_quota}`],
            ]}
          />
        </Card>

        <section aria-labelledby="members-title" aria-busy={members.loading} className="rounded-card border border-line bg-surface pt-5.5 pb-1">
          <h2 id="members-title" className="px-5.5 text-[17px] font-bold">
            Membres{members.data && <span className="font-normal text-muted"> ({members.data.length})</span>}
          </h2>
          {canManage && (
            <p className="mt-1 px-5.5 text-sm text-muted">
              Responsable et directeur gèrent les membres et toutes les réservations de l’organisation. Il doit toujours en rester
              au moins un.
            </p>
          )}
          {members.error ? (
            <ErrorState error={members.error} onRetry={members.reload} className="mx-5.5 my-4" />
          ) : !members.data ? (
            <Loader />
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {members.data.map((member) => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  isMe={member.user_id === user.id}
                  canManage={canManage}
                  onEditRole={(item) => setDialog({ type: 'role', member: item })}
                  onRemove={(item) => setDialog({ type: 'remove', member: item })}
                />
              ))}
            </ul>
          )}
        </section>

        {canManage && pending.length > 0 && (
          <section aria-labelledby="requests-title" className="rounded-card border border-line bg-surface pt-5.5 pb-1">
            <h2 id="requests-title" className="px-5.5 text-[17px] font-bold">
              Demandes d’adhésion en cours ({pending.length})
            </h2>
            <p className="mt-1 px-5.5 text-sm text-muted">La commune examine ces demandes et décide de l’adhésion.</p>
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {pending.map((request) => (
                <PendingJoinRequest key={request.request_id} request={request} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <EditMemberRoleModal
        organizationId={organizationId}
        member={dialog?.member}
        open={dialog?.type === 'role'}
        onClose={() => setDialog(null)}
        onSaved={handleRoleSaved}
      />
      <RemoveMemberModal
        organization={data}
        member={dialog?.member}
        open={dialog?.type === 'remove'}
        onClose={() => setDialog(null)}
        onRemoved={handleRemoved}
      />
    </div>
  )
}
