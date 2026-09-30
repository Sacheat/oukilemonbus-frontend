import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createUserOrgRequest, getAvailableOrganizations } from '../../api/organizations'
import { ProofField } from '../../components/organizations/ProofField'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Field, Select, Textarea } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { proofFileError, REQUESTABLE_ROLES } from '../../lib/organizations'
import { sendProofAndNotice } from '../../lib/requestSubmission'

function fetchAvailable(signal) {
  return getAvailableOrganizations({ signal })
}

// Demande d'adhésion à une organisation existante, examinée par la commune
export function JoinOrganizationPage() {
  const navigate = useNavigate()
  const available = useApi(fetchAvailable)
  const form = useForm({ organization_id: '', requested_role: '', justification: '' })
  const [proof, setProof] = useState(null)
  const [proofError, setProofError] = useState(null)
  // Couvre la demande puis l'envoi du justificatif (form.submitting ne couvre que la demande)
  const [sending, setSending] = useState(false)

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
    const organization = available.data.find((item) => String(item.id) === String(form.values.organization_id))
    const notice = await sendProofAndNotice(
      'adhesion',
      result.data.request_id,
      proof,
      `Votre demande pour rejoindre ${organization?.name ?? 'l’organisation'} a été envoyée à la commune.`,
    )
    navigate('/espace/organisations', { state: { notice } })
  }

  const backLink = (
    <Link to="/espace/organisations" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Mes organisations
    </Link>
  )

  return (
    <div className="max-w-2xl">
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
        <Loader />
      ) : available.data.length === 0 ? (
        <EmptyState
          title="Aucune organisation à rejoindre"
          actions={<Button to="/espace/organisations/creer">Demander la création d’une organisation</Button>}
        >
          Vous faites déjà partie de toutes les organisations disponibles, ou une demande est en cours pour chacune.
        </EmptyState>
      ) : (
        <Card as="section" aria-label="Demande d’adhésion">
          <form onSubmit={handleSubmit} noValidate className="grid gap-4.5">
            {form.error && <Alert tone="danger">{form.error}</Alert>}

            <Field label="Organisation" required error={form.errors.organization_id}>
              {(props) => (
                <Select {...props} value={form.values.organization_id} onChange={form.handle('organization_id')}>
                  <option value="">Choisir une organisation</option>
                  {available.data.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} ({organization.type_label ?? ORGANIZATION_TYPE_LABELS[organization.type]})
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label="Votre rôle dans l’organisation"
              required
              hint="Responsable et directeur peuvent gérer les membres et toutes les réservations de l’organisation."
              error={form.errors.requested_role}
            >
              {(props) => (
                <Select {...props} value={form.values.requested_role} onChange={form.handle('requested_role')}>
                  <option value="">Choisir un rôle</option>
                  {REQUESTABLE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

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
      )}
    </div>
  )
}
