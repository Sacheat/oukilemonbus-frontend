import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { createUserOrgRequest, getAvailableOrganizations } from '../../api/organizations'
import { OrganizationPicker } from '../../components/organizations/OrganizationPicker'
import { ProofField } from '../../components/organizations/ProofField'
import { RequestPreview } from '../../components/organizations/RequestPreview'
import { RequestSent } from '../../components/organizations/RequestSent'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ChoicePills } from '../../components/ui/ChoicePills'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Field, Textarea } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { proofFileError, REQUESTABLE_ROLES } from '../../lib/organizations'
import { sendProofAndNotice } from '../../lib/requestSubmission'

function fetchAvailable(signal) {
  return getAvailableOrganizations({ signal })
}

// Demande d'adhésion à une organisation existante, examinée par la commune : choix de l'organisation
// (recherche et cartes), rôle en pastilles, justification et justificatif ; récapitulatif à droite,
// puis écran de fin avec le suivi de la demande
export function JoinOrganizationPage() {
  const available = useApi(fetchAvailable)
  const form = useForm({ organization_id: '', requested_role: '', justification: '' })
  const [proof, setProof] = useState(null)
  const [proofError, setProofError] = useState(null)
  // Couvre la demande puis l'envoi du justificatif (form.submitting ne couvre que la demande)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null) // { request, notice }

  const set = (field) => (value) => form.setValues((current) => ({ ...current, [field]: value }))
  const organization = available.data?.find((item) => String(item.id) === String(form.values.organization_id))
  const role = REQUESTABLE_ROLES.find((item) => item.value === form.values.requested_role)

  function handleProof(file) {
    setProof(file)
    setProofError(proofFileError(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (proofError || sending) return
    setSending(true)
    const result = await form.submit(createUserOrgRequest)
    if (!result.ok) {
      setSending(false)
      return
    }
    const notice = await sendProofAndNotice(
      'adhesion',
      result.data.request_id,
      proof,
      `Votre demande pour rejoindre ${organization?.name ?? 'l’organisation'} a été envoyée à la commune.`,
    )
    // La réponse ne contient pas toujours l'organisation : on reprend celle choisie
    setSent({ request: { organization, ...result.data }, notice })
    window.scrollTo({ top: 0 })
  }

  const backLink = (
    <Link to="/espace/organisations" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Mes organisations
    </Link>
  )

  if (sent) {
    return (
      <>
        {backLink}
        <PageHeader eyebrow="Mes organisations" title="Demande envoyée" className="mt-2" />
        <RequestSent kind="adhesion" request={sent.request} notice={sent.notice} />
      </>
    )
  }

  return (
    <>
      {backLink}
      <PageHeader
        eyebrow="Mes organisations"
        title="Rejoindre une organisation"
        description="La commune examine votre demande. Vous pourrez réserver dès qu’elle sera acceptée."
        className="mt-2"
      />

      {available.error ? (
        <ErrorState error={available.error} onRetry={available.reload} />
      ) : !available.data ? (
        <div role="status" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <span className="sr-only">Chargement des organisations…</span>
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="hidden h-64 rounded-card lg:block" />
        </div>
      ) : available.data.length === 0 ? (
        <EmptyState
          title="Aucune organisation à rejoindre"
          actions={<Button to="/espace/organisations/creer">Demander la création d’une organisation</Button>}
        >
          Vous faites déjà partie de toutes les organisations disponibles, ou une demande est en cours pour chacune.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card as="section" aria-label="Demande d’adhésion" className="p-5 sm:p-7">
            <form onSubmit={handleSubmit} noValidate className="grid gap-6">
              {form.error && <Alert tone="danger">{form.error}</Alert>}

              <OrganizationPicker
                organizations={available.data}
                value={form.values.organization_id}
                onChange={set('organization_id')}
                error={form.errors.organization_id}
              />

              <ChoicePills
                legend="Votre rôle dans l’organisation"
                required
                options={REQUESTABLE_ROLES}
                value={form.values.requested_role}
                onChange={set('requested_role')}
                hint="Responsable et directeur peuvent gérer les membres et toutes les réservations de l’organisation."
                error={form.errors.requested_role}
              />

              <Field
                label="Justification"
                hint="Expliquez votre lien avec l’organisation (fonction, classe, activité…). Facultatif mais recommandé."
                error={form.errors.justification}
              >
                {(props) => <Textarea {...props} value={form.values.justification} onChange={form.handle('justification')} />}
              </Field>

              <ProofField hint="Par exemple une attestation de l’organisation." error={proofError} onChange={handleProof} />

              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="secondary" to="/espace/organisations">
                  Annuler
                </Button>
                <Button type="submit" loading={sending}>
                  <Send className="size-4" aria-hidden="true" /> Envoyer la demande
                </Button>
              </div>
            </form>
          </Card>

          <RequestPreview
            title="Votre demande"
            name={organization?.name}
            empty="Choisissez l’organisation à rejoindre."
            lines={[
              organization && (organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]),
              role && `Rôle demandé : ${role.label}`,
              proof && !proofError && `Justificatif : ${proof.name}`,
            ]}
          />
        </div>
      )}
    </>
  )
}
