import { Building2, Inbox, Plus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { getOrgRegistrationRequests, getUserOrgRequests, makeDefaultOrganization } from '../../api/organizations'
import { useAuth } from '../../auth/useAuth'
import { LeaveOrganizationModal } from '../../components/organizations/LeaveOrganizationModal'
import { OrganizationCard } from '../../components/organizations/OrganizationCard'
import { RequestItem } from '../../components/organizations/RequestItem'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { getErrorMessage } from '../../lib/errors'
import { myRequests } from '../../lib/organizations'

// Première page de chaque type de demande (15 les plus récentes suffisent pour un usager)
async function fetchRequests(signal) {
  const [joinRequests, creationRequests] = await Promise.all([
    getUserOrgRequests({}, { signal }),
    getOrgRegistrationRequests({}, { signal }),
  ])
  return { joinRequests: joinRequests.data, creationRequests: creationRequests.data }
}

// Mes organisations : appartenances (depuis /auth/me) et demandes d'adhésion ou de création
export function OrganizationsPage() {
  const { user, can, refresh } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(location.state?.notice ?? null)
  const [actionError, setActionError] = useState(null)
  const [makingDefault, setMakingDefault] = useState(null) // id de l'organisation en cours
  const [leaving, setLeaving] = useState(null) // organisation à quitter

  // Le message ne doit s'afficher qu'une fois : on le retire de l'historique
  useEffect(() => {
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])

  // Une demande a pu être acceptée depuis la connexion : on recharge les appartenances
  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const requests = useApi(fetchRequests)
  const organizations = user.organizations ?? []
  const items = requests.data ? myRequests(user.id, requests.data.joinRequests, requests.data.creationRequests) : []
  const canJoin = can('user-org-requests.create')
  const canCreate = can('org-registration-requests.create')

  async function handleMakeDefault(organization) {
    setMakingDefault(organization.id)
    setActionError(null)
    setNotice(null)
    try {
      await makeDefaultOrganization(organization.id)
      await refresh()
      setNotice({ tone: 'success', message: `${organization.name} est maintenant votre organisation par défaut.` })
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setMakingDefault(null)
    }
  }

  const handleLeft = useCallback(
    async (organization) => {
      await refresh()
      setLeaving(null)
      setActionError(null)
      setNotice({ tone: 'success', message: `Vous avez quitté ${organization.name}.` })
    },
    [refresh],
  )

  const actions = (
    <>
      {canJoin && (
        <Button to="/espace/organisations/rejoindre">
          <UserPlus className="size-4" aria-hidden="true" /> Rejoindre une organisation
        </Button>
      )}
      {canCreate && (
        <Button variant="secondary" to="/espace/organisations/creer">
          <Plus className="size-4" aria-hidden="true" /> Demander la création
        </Button>
      )}
    </>
  )

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Mon espace"
        title="Mes organisations"
        description="Vous réservez au nom des organisations dont vous faites partie."
        actions={actions}
        className="pb-5"
      />

      <div className="grid gap-8">
        {notice && <Alert tone={notice.tone ?? 'success'}>{notice.message ?? notice}</Alert>}
        {actionError && <Alert tone="danger">{actionError}</Alert>}

        <section aria-labelledby="organizations-title">
          <h2 id="organizations-title" className="mb-3 text-[19px] font-bold">
            Mes organisations
          </h2>
          {organizations.length === 0 ? (
            <EmptyState icon={Building2} title="Vous ne faites partie d’aucune organisation" actions={actions}>
              Pour réserver le bus, rejoignez l’organisation (école, ASBL…) pour laquelle vous organisez des déplacements, ou
              demandez sa création si elle n’existe pas encore.
            </EmptyState>
          ) : (
            <ul className="grid gap-3.5">
              {organizations.map((organization) => (
                <OrganizationCard
                  key={organization.id}
                  organization={organization}
                  onMakeDefault={handleMakeDefault}
                  makingDefault={makingDefault === organization.id}
                  onLeave={setLeaving}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="requests-title" aria-busy={requests.loading}>
          <h2 id="requests-title" className="mb-3 text-[19px] font-bold">
            Mes demandes
          </h2>
          {requests.error ? (
            <ErrorState error={requests.error} onRetry={requests.reload} />
          ) : !requests.data ? (
            <div role="status" className="grid gap-3.5">
              <span className="sr-only">Chargement des demandes…</span>
              <Skeleton className="h-44 rounded-card" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Inbox} title="Aucune demande">
              Vos demandes d’adhésion et de création d’organisation apparaîtront ici.
            </EmptyState>
          ) : (
            <ul className="grid gap-3.5">
              {items.map((item) => (
                <RequestItem key={`${item.kind}-${item.id}`} kind={item.kind} request={item.request} onChanged={requests.reload} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <LeaveOrganizationModal
        organization={leaving}
        open={leaving !== null}
        onClose={() => setLeaving(null)}
        onLeft={handleLeft}
      />
    </div>
  )
}
