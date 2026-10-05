import { Pencil } from 'lucide-react'
import { useCallback, useState } from 'react'
import { getOrganization } from '../../api/organizations'
import { useApi } from '../../hooks/useApi'
import { rulesSentences } from '../../lib/organizationsAdmin'
import { shortAddress } from '../../lib/reservations'
import { QuotaGauge } from '../organizations/QuotaGauge'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { DetailList } from '../ui/DetailList'
import { ErrorState } from '../ui/ErrorState'
import { Loader } from '../ui/Loader'
import { BanControl } from './BanControl'
import { OrganizationForm } from './OrganizationForm'
import { OrganizationMembers } from './OrganizationMembers'
import { OrganizationReservations } from './OrganizationReservations'
import { ProofDocumentButton } from './ProofDocumentButton'

// Une organisation ouverte dans le panneau de /gestion/organisations, relue par GET /organizations/{id} (le lien
// ?organisation=id fonctionne même hors de la page de liste affichée) :
//   coordonnées et règles du type (« Modifier » ouvre le formulaire), quota de l'année, membres, réservations,
//   justificatif, puis bannir / réactiver (admin).
// `onChanged(organisation, message)` après chaque action : la page recharge la liste et affiche le message.
export function OrganizationPanel({ organizationId, types, canBan, onChanged }) {
  const fetchOrganization = useCallback((signal) => getOrganization(organizationId, { signal }), [organizationId])
  const loaded = useApi(fetchOrganization)
  const [editing, setEditing] = useState(false)

  if (loaded.error) return <ErrorState error={loaded.error} onRetry={loaded.reload} />
  if (!loaded.data) return <Loader />
  const organization = loaded.data
  const quota = organization.quota

  function changed(message) {
    loaded.reload()
    onChanged(organization, message)
  }

  if (editing) {
    return (
      <OrganizationForm
        organization={organization}
        types={types}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          changed(`« ${organization.name} » enregistrée.`)
        }}
      />
    )
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex flex-wrap items-center gap-2 font-bold">
            {organization.type_label}
            {organization.is_banned && <Badge tone="danger">Bannie</Badge>}
          </h3>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden="true" /> Modifier
          </Button>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {rulesSentences(organization.rules, quota?.limit).map((sentence) => (
            <li key={sentence}>
              <Badge tone="neutral">{sentence}</Badge>
            </li>
          ))}
        </ul>
        <DetailList
          items={[
            ['E-mail officiel', organization.official_email ?? '—'],
            ['Téléphone', organization.phone_contact ?? '—'],
            ['Contact', organization.name_contact ?? '—'],
            ['Siège social', organization.location ? organization.location.formatted_address ?? shortAddress(organization.location) : '—'],
            ['Membres', organization.members_count],
          ]}
        />
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Quota {quota?.year}</h3>
        {quota?.exempt ? (
          <p className="text-sm text-muted">Sans quota annuel (type exempté).</p>
        ) : (
          <QuotaGauge used={quota?.used ?? 0} quota={quota?.limit ?? organization.annual_quota} />
        )}
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Réservations</h3>
        <OrganizationReservations organization={organization} />
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Membres</h3>
        <OrganizationMembers organization={organization} onChanged={(message) => changed(message)} />
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Justificatif</h3>
        {organization.proof_document_id ? (
          <ProofDocumentButton documentId={organization.proof_document_id} />
        ) : (
          <p className="text-sm text-muted">Aucun justificatif joint.</p>
        )}
      </section>

      {canBan && (
        <section className="grid gap-2 border-t border-line pt-5">
          <h3 className="font-bold">Accès au service</h3>
          <BanControl organization={organization} onChanged={(_updated, message) => changed(message)} />
        </section>
      )}
    </div>
  )
}
