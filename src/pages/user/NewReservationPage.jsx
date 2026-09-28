import { ArrowLeft, ArrowRight, Building2, CircleCheck, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { createReservation, previewReservation } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { PassengersStep } from '../../components/reservations/wizard/PassengersStep'
import { RequestSummary } from '../../components/reservations/wizard/RequestSummary'
import { ReviewStep } from '../../components/reservations/wizard/ReviewStep'
import { StepIndicator } from '../../components/reservations/wizard/StepIndicator'
import { TripStep } from '../../components/reservations/wizard/TripStep'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useTripCheck } from '../../hooks/useTripCheck'
import { clearDraft, loadDraft, saveDraft } from '../../lib/drafts'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import {
  EMPTY_RESERVATION,
  mapApiErrors,
  missingFields,
  stepOfField,
  toReservationPayload,
  toTripPayload,
} from '../../lib/reservationForm'
import { statusHint, todayApiDate } from '../../lib/reservations'

const DRAFT_NAME = 'new-reservation'

const STEP_TEXTS = {
  1: { title: 'Commençons par votre trajet', card: 'Où et quand souhaitez-vous partir ?', intro: 'Renseignez les lieux et les horaires souhaités.' },
  2: { title: 'Qui voyage ?', card: 'Passagers et motif', intro: 'Indiquez le nombre de passagers et la raison du déplacement.' },
  3: { title: 'Vérifiez votre demande', card: 'Récapitulatif', intro: 'Relisez les informations avant l’envoi.' },
}

// Organisations pour lesquelles on peut réserver (non bannies) et celle présélectionnée
function bookableOrganizations(user) {
  return (user.organizations ?? []).filter((organization) => !organization.is_banned)
}

function freshValues(organizations) {
  const preferred = organizations.find((organization) => organization.membership?.is_default) ?? (organizations.length === 1 ? organizations[0] : null)
  return { ...EMPTY_RESERVATION, organization_id: preferred ? String(preferred.id) : '' }
}

// État initial : brouillon de l'utilisateur s'il existe (sans date passée), sinon formulaire vierge
function initialState(user, organizations) {
  const draft = loadDraft(DRAFT_NAME, user.id)
  if (!draft) return { values: freshValues(organizations), step: 1, idempotency: null, restored: false }
  const values = { ...EMPTY_RESERVATION, ...draft.values }
  if (values.trip_date && values.trip_date < todayApiDate()) values.trip_date = ''
  if (!organizations.some((organization) => String(organization.id) === String(values.organization_id))) {
    values.organization_id = freshValues(organizations).organization_id
  }
  // Le preview de l'étape 3 est relancé à la main : on reprend au plus à l'étape 2
  return { values, step: Math.min(draft.step ?? 1, 2), idempotency: draft.idempotency ?? null, restored: true }
}

const IDLE_PREVIEW = { status: 'idle', result: null, error: null }

// Nouvelle réservation (maquette 03 : réservation guidée en 4 étapes)
export function NewReservationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const organizations = bookableOrganizations(user)
  const [initial] = useState(() => initialState(user, organizations))
  const [values, setValues] = useState(initial.values)
  const [step, setStep] = useState(initial.step)
  const [restored, setRestored] = useState(initial.restored)
  // Clé d'idempotence liée au corps envoyé : réutilisée si on renvoie la même demande
  const [idempotency, setIdempotency] = useState(initial.idempotency)
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(IDLE_PREVIEW)
  const [acknowledged, setAcknowledged] = useState(false)
  // Le trajet vérifié à l'étape 1 demande une dérogation : on invite à la justifier dans le motif
  const [needsJustification, setNeedsJustification] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [created, setCreated] = useState(null)
  const headingRef = useRef(null)
  const tripCheck = useTripCheck(step === 1 ? toTripPayload(values) : null)

  const organization = organizations.find((item) => String(item.id) === String(values.organization_id))

  // Brouillon enregistré à chaque modification, tant que la demande n'est pas envoyée
  useEffect(() => {
    if (!created) saveDraft(DRAFT_NAME, user.id, { values, step, idempotency })
  }, [values, step, idempotency, created, user.id])

  // Accessibilité : le focus suit le changement d'étape
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    // Retire l'erreur du champ (une clé à undefined masquerait l'erreur de la vérification en direct)
    setErrors((current) => {
      // eslint-disable-next-line no-unused-vars
      const { [field]: removed, ...rest } = current
      return rest
    })
  }

  function goTo(nextStep) {
    setStep(nextStep)
    setRestored(false)
    window.scrollTo({ top: 0 })
  }

  // Erreurs 422 du backend : sous les champs, en revenant à l'étape concernée
  function showApiErrors(error) {
    const fieldErrors = mapApiErrors(getFieldErrors(error))
    const steps = Object.keys(fieldErrors).map(stepOfField).filter(Boolean)
    if (steps.length === 0) return false
    setErrors(fieldErrors)
    goTo(Math.min(...steps))
    return true
  }

  async function runPreview(currentValues) {
    setPreview({ status: 'loading', result: null, error: null })
    setAcknowledged(false)
    try {
      const result = await previewReservation(toReservationPayload(currentValues))
      setPreview({ status: 'done', result, error: null })
    } catch (error) {
      if (showApiErrors(error)) setPreview(IDLE_PREVIEW)
      else setPreview({ status: 'error', result: null, error })
    }
  }

  function handleContinue() {
    const missing = missingFields(values, step)
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }
    if (step === 1) {
      if (Object.keys(tripCheck.fieldErrors).length > 0) return // erreurs déjà affichées sous les champs
      setNeedsJustification(tripCheck.result?.warnings?.length > 0)
      goTo(2)
    } else if (step === 2) {
      goTo(3)
      runPreview(values)
    }
  }

  function applySlot(departure, returnTime) {
    const next = { ...values, departure_time: departure, return_time: returnTime }
    setValues(next)
    if (step === 3) runPreview(next)
  }

  async function handleSend() {
    const payload = toReservationPayload(values)
    const hash = JSON.stringify(payload)
    const key = idempotency?.hash === hash ? idempotency.key : crypto.randomUUID()
    setIdempotency({ hash, key })
    setSending(true)
    setSendError(null)
    try {
      const reservation = await createReservation(payload, key)
      clearDraft(DRAFT_NAME)
      setCreated(reservation)
      goTo(4)
    } catch (error) {
      if (!showApiErrors(error)) setSendError(getErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  function restart() {
    clearDraft(DRAFT_NAME)
    setValues(freshValues(organizations))
    setIdempotency(null)
    setErrors({})
    setPreview(IDLE_PREVIEW)
    setAcknowledged(false)
    setSendError(null)
    setCreated(null)
    setRestored(false)
    goTo(1)
  }

  if (organizations.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Nouvelle réservation" title="Commençons par votre trajet" />
        <EmptyState
          icon={Building2}
          title="Aucune organisation pour réserver"
          actions={<Button to="/espace/organisations">Rejoindre ou créer une organisation</Button>}
        >
          Les réservations se font au nom d’une organisation dont vous êtes membre.
        </EmptyState>
      </>
    )
  }

  if (step === 4 && created) {
    return (
      <>
        <PageHeader eyebrow="Nouvelle réservation" title="Demande envoyée" />
        <StepIndicator current={4} />
        <Card className="mx-auto max-w-xl p-8 text-center">
          <CircleCheck className="mx-auto size-11 text-success" aria-hidden="true" />
          <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-xl font-bold outline-none">
            Votre demande a bien été envoyée
          </h2>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={created.status} label={created.status_label} />
          </div>
          <p className="mt-3 text-muted">{statusHint(created)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button to={`/espace/deplacements/${created.id}`}>Voir le détail</Button>
            <Button variant="secondary" to="/espace/deplacements">
              Mes déplacements
            </Button>
            <Button variant="link" onClick={restart}>
              Nouvelle réservation
            </Button>
          </div>
        </Card>
      </>
    )
  }

  const texts = STEP_TEXTS[step]
  const result = preview.result
  const canSend =
    preview.status === 'done' && result?.is_allowed && (!(result.warnings?.length > 0) || acknowledged)

  return (
    <>
      <PageHeader
        eyebrow="Nouvelle réservation"
        title={texts.title}
        description="Vous pourrez vérifier toutes les informations avant l’envoi."
        className="pb-6"
      />
      <StepIndicator current={step} onSelect={goTo} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card as="section" aria-labelledby="step-title" className="p-5 sm:p-7">
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-[21px] font-bold outline-none">
            {texts.card}
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">{texts.intro}</p>

          {restored && (
            <Alert tone="info" className="mb-5">
              Nous avons repris votre saisie en cours.{' '}
              <Button variant="link" className="text-sm" onClick={restart}>
                Recommencer à zéro
              </Button>
            </Alert>
          )}
          {sendError && (
            <Alert tone="danger" className="mb-5">
              {sendError}
            </Alert>
          )}

          {step === 1 && (
            <TripStep
              values={values}
              setField={setField}
              errors={errors}
              organizations={organizations}
              tripCheck={tripCheck}
              onUseSlot={applySlot}
            />
          )}
          {step === 2 && (
            <PassengersStep
              values={values}
              setField={setField}
              errors={errors}
              needsJustification={needsJustification || preview.result?.warnings?.length > 0}
            />
          )}
          {step === 3 && (
            <ReviewStep
              values={values}
              organization={organization}
              preview={preview}
              onRetry={() => runPreview(values)}
              onEditStep={goTo}
              onUseSlot={applySlot}
              acknowledged={acknowledged}
              setAcknowledged={setAcknowledged}
            />
          )}

          <div className="mt-6.5 flex flex-wrap items-center justify-between gap-3">
            {step === 1 ? (
              <Button variant="secondary" onClick={() => navigate('/espace/deplacements')}>
                Annuler
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => goTo(step - 1)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Retour
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleContinue}>
                {step === 1 ? 'Continuer vers les passagers' : 'Vérifier la demande'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handleSend} loading={sending} disabled={!canSend}>
                <Send className="size-4" aria-hidden="true" /> Envoyer la demande
              </Button>
            )}
          </div>
        </Card>

        <RequestSummary values={values} organization={organization} step={step} />
      </div>
    </>
  )
}
