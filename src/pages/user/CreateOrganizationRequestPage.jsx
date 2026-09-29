import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createOrgRegistrationRequest } from '../../api/organizations'
import { ProofField } from '../../components/organizations/ProofField'
import { LocationPicker } from '../../components/reservations/LocationPicker'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { PageHeader } from '../../components/ui/PageHeader'
import { useForm } from '../../hooks/useForm'
import { ORGANIZATION_TYPE_LABELS } from '../../lib/labels'
import { proofFileError } from '../../lib/organizations'
import { sendProofAndNotice } from '../../lib/requestSubmission'

const EMPTY_REQUEST = {
  organization_name: '',
  organization_type: '',
  enterprise_number: '',
  official_email: '',
  phone: '',
  location_id: null, // objet Location
  contact_person_name: '',
  contact_person_role: '',
  comment: '',
}

// Demande de création d'une organisation qui n'existe pas encore, examinée par la commune
export function CreateOrganizationRequestPage() {
  const navigate = useNavigate()
  const form = useForm(EMPTY_REQUEST)
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
    const result = await form.submit(createOrgRegistrationRequest)
    if (!result.ok) {
      setSending(false)
      return
    }
    const notice = await sendProofAndNotice(
      'creation',
      result.data.id,
      proof,
      `Votre demande de création de ${result.data.organization_name} a été envoyée à la commune.`,
    )
    navigate('/espace/organisations', { state: { notice } })
  }

  const { values, errors, handle } = form

  return (
    <div className="max-w-3xl">
      <Link to="/espace/organisations" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-link hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Mes organisations
      </Link>
      <PageHeader
        eyebrow="Mes organisations"
        title="Demander la création d’une organisation"
        description="Si votre organisation n’existe pas encore. La commune vérifie la demande ; une fois acceptée, vous en devenez membre."
        className="mt-2"
      />

      <Card as="section" aria-label="Demande de création d’organisation">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4.5 sm:grid-cols-2">
          {form.error && (
            <Alert tone="danger" className="sm:col-span-2">
              {form.error}
            </Alert>
          )}

          <h2 className="text-[17px] font-bold sm:col-span-2">L’organisation</h2>
          <Field label="Nom de l’organisation" required error={errors.organization_name} className="sm:col-span-2">
            {(props) => <Input {...props} maxLength={255} value={values.organization_name} onChange={handle('organization_name')} />}
          </Field>
          <Field label="Type" required error={errors.organization_type}>
            {(props) => (
              <Select {...props} value={values.organization_type} onChange={handle('organization_type')}>
                <option value="">Choisir un type</option>
                {Object.entries(ORGANIZATION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Numéro d’entreprise" hint="Par exemple 0123.456.789. Facultatif." error={errors.enterprise_number}>
            {(props) => <Input {...props} maxLength={50} value={values.enterprise_number} onChange={handle('enterprise_number')} />}
          </Field>
          <Field label="Adresse e-mail officielle" required error={errors.official_email}>
            {(props) => (
              <Input {...props} type="email" autoComplete="email" value={values.official_email} onChange={handle('official_email')} />
            )}
          </Field>
          <Field label="Téléphone" hint="Facultatif." error={errors.phone}>
            {(props) => <Input {...props} type="tel" maxLength={20} value={values.phone} onChange={handle('phone')} />}
          </Field>
          <Field label="Adresse" hint="Facultatif." error={errors.location_id} className="sm:col-span-2">
            {(props) => (
              <LocationPicker
                inputProps={props}
                value={values.location_id}
                onChange={(location) => form.setValues((current) => ({ ...current, location_id: location }))}
              />
            )}
          </Field>

          <h2 className="mt-2 text-[17px] font-bold sm:col-span-2">Personne de contact</h2>
          <Field label="Nom" hint="Facultatif." error={errors.contact_person_name}>
            {(props) => <Input {...props} maxLength={100} value={values.contact_person_name} onChange={handle('contact_person_name')} />}
          </Field>
          <Field label="Fonction" hint="Par exemple directrice, président… Facultatif." error={errors.contact_person_role}>
            {(props) => <Input {...props} maxLength={100} value={values.contact_person_role} onChange={handle('contact_person_role')} />}
          </Field>

          <Field
            label="Commentaire"
            hint="Toute information utile à la commune pour vérifier la demande. Facultatif."
            error={errors.comment}
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} value={values.comment} onChange={handle('comment')} />}
          </Field>
          <ProofField
            hint="Par exemple les statuts de l’ASBL ou un courrier officiel."
            error={proofError}
            onChange={handleProof}
            className="sm:col-span-2"
          />

          <div className="flex flex-wrap justify-between gap-3 sm:col-span-2">
            <Button variant="secondary" to="/espace/organisations">
              Annuler
            </Button>
            <Button type="submit" loading={sending}>
              <Send className="size-4" aria-hidden="true" /> Envoyer la demande
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
