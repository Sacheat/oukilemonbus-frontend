import { ArrowLeft, CalendarCheck, Inbox, Route, ShieldCheck, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getOrganization, getOrganizationMembers, getUserOrgRequests } from '../../api/organizations'
import { useAuth } from '../../auth/useAuth'
import { EditMemberRoleModal } from '../../components/organizations/EditMemberRoleModal'
import { MemberRow } from '../../components/organizations/MemberRow'
import { OrganizationHero } from '../../components/organizations/OrganizationHero'
import { PendingJoinRequest } from '../../components/organizations/PendingJoinRequest'
import { QuotaGauge } from '../../components/organizations/QuotaGauge'
import { RemoveMemberModal } from '../../components/organizations/RemoveMemberModal'
import { FactTiles } from '../../components/reservations/FactTiles'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DetailList } from '../../components/ui/DetailList'
import { ErrorState } from '../../components/ui/ErrorState'
import { Panel } from '../../components/ui/Panel'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import { RELATIONSHIP_TYPE_LABELS } from '../../lib/labels'
import { pendingJoinRequestsFor } from '../../lib/organizations'
import { shortAddress } from '../../lib/reservations'

// Détail d'une de mes organisations : bandeau, chiffres clés, informations et quota, puis pour un responsable
// les demandes d'adhésion en cours (décidées par la commune) et la gestion des membres
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
  if (!data || (organization.loading && data.id !== organizationId)) {
    return (
      <div role="status" className="grid gap-5">
        <span className="sr-only">Chargement de l’organisation…</span>
        {backLink}
        <Skeleton className="h-40 w-full rounded-panel" />
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    )
  }

  const pending = pendingJoinRequestsFor(organizationId, user.id, requests.data)
  const membership = user.organizations?.find((item) => item.id === organizationId)?.membership
  // Responsables et directeurs d'abord, puis par nom
  const sortedMembers = members.data
    ? [...members.data].sort((a, b) => Number(b.is_manager) - Number(a.is_manager) || a.full_name.localeCompare(b.full_name, 'fr'))
    : null
  const managerCount = members.data?.filter((member) => member.is_manager).length

  const facts = [
    members.data && { icon: Users, label: 'Membres', value: members.data.length },
    members.data && { icon: ShieldCheck, label: 'Responsables', value: managerCount },
    data.is_priority
      ? { icon: CalendarCheck, label: 'Réservations', value: 'Sans quota', detail: 'approbation automatique' }
      : {
          icon: CalendarCheck,
          label: 'Cette année',
          value: `${data.reservations_used_this_year} / ${data.annual_quota}`,
          detail: 'réservations',
        },
    canManage && { icon: Inbox, label: 'Demandes en cours', value: requests.data ? pending.length : '…' },
  ].filter(Boolean)

  return (
    <div className="grid gap-5">
      <div>{backLink}</div>

      <OrganizationHero organization={data} membership={membership}>
        <Button variant="accent" to={`/espace/deplacements?organisation=${organizationId}&periode=tous`}>
          <Route className="size-4" aria-hidden="true" /> Réservations de l’organisation
        </Button>
      </OrganizationHero>

      {notice && <Alert tone="success">{notice}</Alert>}
      {data.is_banned && (
        <Alert tone="danger" title="Organisation bannie">
          Elle ne peut plus réserver{data.banned_reason ? ` : ${data.banned_reason}` : '.'}
        </Alert>
      )}

      <FactTiles facts={facts} />

      {/* Sans le panneau des demandes (réservé aux responsables), les informations prennent toute la largeur */}
      <div className={cx('grid items-start gap-5', canManage && 'lg:grid-cols-2')}>
        <Panel title="Informations">
          <div className="px-5 pb-5">
            <DetailList
              items={[
                data.official_email && ['E-mail officiel', data.official_email],
                data.phone_contact && ['Téléphone', data.phone_contact],
                data.name_contact && ['Contact', data.name_contact],
                data.location && ['Adresse', shortAddress(data.location)],
                data.is_priority && ['Réservations', 'Approbation automatique, pas de quota annuel'],
              ]}
            />
            {!data.is_priority && (
              <QuotaGauge used={data.reservations_used_this_year} quota={data.annual_quota} className="mt-4" />
            )}
          </div>
        </Panel>

        {canManage && (
          <Panel title={`Demandes d’adhésion en cours${requests.data ? ` (${pending.length})` : ''}`}>
            <p className="px-5 pt-4 text-sm text-muted">La commune examine ces demandes et décide de l’adhésion.</p>
            {!requests.data ? (
              <Skeleton className="m-5 h-16 rounded-card" />
            ) : pending.length === 0 ? (
              <p className="px-5 pt-2 pb-5 text-sm">Aucune demande en cours.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {pending.map((request) => (
                  <PendingJoinRequest key={request.request_id} request={request} />
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>

      <section aria-busy={members.loading}>
        <Panel title={`Membres${members.data ? ` (${members.data.length})` : ''}`}>
          {canManage && (
            <p className="px-5 pt-4 text-sm text-muted">
              Responsable et directeur gèrent les membres et toutes les réservations de l’organisation. Il doit toujours en rester
              au moins un.
            </p>
          )}
          {members.error ? (
            <ErrorState error={members.error} onRetry={members.reload} className="m-5" />
          ) : !sortedMembers ? (
            <div role="status" className="grid gap-2 p-5">
              <span className="sr-only">Chargement des membres…</span>
              <Skeleton className="h-12 rounded-card" />
              <Skeleton className="h-12 rounded-card" />
            </div>
          ) : (
            <ul className={cx('divide-y divide-line', canManage && 'mt-3 border-t border-line')}>
              {sortedMembers.map((member) => (
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
        </Panel>
      </section>

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
