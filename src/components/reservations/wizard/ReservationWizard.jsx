import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createReservation, previewReservation, updateReservation } from '../../../api/reservations'
import { useTripCheck } from '../../../hooks/useTripCheck'
import { clearDraft, saveDraft } from '../../../lib/drafts'
import { getErrorMessage, getFieldErrors } from '../../../lib/errors'
import {
  changedFields,
  mapApiErrors,
  missingFields,
  stepOfField,
  toReservationPayload,
  toTripPayload,
  toUpdatePayload,
  withoutSelfConflicts,
} from '../../../lib/reservationForm'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PageHeader } from '../../ui/PageHeader'
import { PassengersStep } from './PassengersStep'
import { RequestSummary } from './RequestSummary'
import { ReviewStep } from './ReviewStep'
import { StepIndicator } from './StepIndicator'
import { TripStep } from './TripStep'

const TEXTS = {
  create: {
    eyebrow: 'Nouvelle réservation',
    titles: { 1: 'Commençons par votre trajet', 2: 'Qui voyage ?', 3: 'Vérifiez votre demande' },
    intros: {
      1: 'Renseignez les lieux et les horaires souhaités.',
      2: 'Indiquez le nombre de passagers et la raison du déplacement.',
      3: 'Relisez les informations avant l’envoi.',
    },
  },
  edit: {
    eyebrow: 'Modifier la réservation',
    titles: { 1: 'Modifiez votre trajet', 2: 'Qui voyage ?', 3: 'Vérifiez les changements' },
    intros: {
      1: 'Changez les lieux ou les horaires si nécessaire.',
      2: 'Mettez à jour les passagers ou le motif.',
      3: 'Relisez les changements avant de les enregistrer.',
    },
  },
}
const CARD_TITLES = { 1: 'Où et quand souhaitez-vous partir ?', 2: 'Passagers et motif', 3: 'Récapitulatif' }
const IDLE_PREVIEW = { status: 'idle', result: null, error: null }

// Assistant de réservation (maquette 03), en création ou en modification.
// - create : `draft` = { name, userId } pour le brouillon, `onDone(réservation créée)`
// - edit : `reservation` d'origine (organisation figée, changements avant → après), `onDone(réservation modifiée)`
export function ReservationWizard({ mode, initial, organizations, reservation = null, draft = null, onDone, onCancel, onRestart }) {
  const texts = TEXTS[mode]
  const reservationId = reservation?.id ?? null
  const [values, setValues] = useState(initial.values)
  const [step, setStep] = useState(initial.step ?? 1)
  const [restored, setRestored] = useState(Boolean(initial.restored))
  // Création : clé d'idempotence liée au corps envoyé, réutilisée si on renvoie la même demande
  const [idempotency, setIdempotency] = useState(initial.idempotency ?? null)
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(IDLE_PREVIEW)
  const [acknowledged, setAcknowledged] = useState(false)
  // Le trajet vérifié à l'étape 1 demande une dérogation : on invite à la justifier dans le motif
  const [needsJustification, setNeedsJustification] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const headingRef = useRef(null)
  const tripCheck = useTripCheck(step === 1 ? toTripPayload(values, reservationId) : null)

  const organization = organizations.find((item) => String(item.id) === String(values.organization_id))
  const changes = reservation ? changedFields(initial.values, values) : null

  // Brouillon (création uniquement) enregistré à chaque modification
  useEffect(() => {
    if (draft) saveDraft(draft.name, draft.userId, { values, step, idempotency })
  }, [draft, values, step, idempotency])

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
      const result = await previewReservation(toReservationPayload(currentValues, reservationId))
      setPreview({ status: 'done', result: withoutSelfConflicts(result, reservationId), error: null })
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

  async function save() {
    if (mode === 'edit') return updateReservation(reservationId, toUpdatePayload(values))
    const payload = toReservationPayload(values)
    const hash = JSON.stringify(payload)
    const key = idempotency?.hash === hash ? idempotency.key : crypto.randomUUID()
    setIdempotency({ hash, key })
    return createReservation(payload, key)
  }

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      const saved = await save()
      if (draft) clearDraft(draft.name)
      onDone(saved)
    } catch (error) {
      if (!showApiErrors(error)) setSendError(getErrorMessage(error))
      setSending(false)
    }
  }

  const result = preview.result
  const canSend =
    preview.status === 'done' &&
    result?.is_allowed &&
    (!(result.warnings?.length > 0) || acknowledged) &&
    (mode === 'create' || changes.length > 0)

  return (
    <>
      <PageHeader
        eyebrow={texts.eyebrow}
        title={texts.titles[step]}
        description={mode === 'create' ? 'Vous pourrez vérifier toutes les informations avant l’envoi.' : reservation.trip_purpose}
        className="pb-6"
      />
      <StepIndicator current={step} onSelect={goTo} lastLabel={mode === 'edit' ? 'Enregistrement' : 'Envoi'} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card as="section" aria-labelledby="step-title" className="p-5 sm:p-7">
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-[21px] font-bold outline-none">
            {CARD_TITLES[step]}
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">{texts.intros[step]}</p>

          {restored && onRestart && (
            <Alert tone="info" className="mb-5">
              Nous avons repris votre saisie en cours.{' '}
              <Button variant="link" className="text-sm" onClick={onRestart}>
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
              lockOrganization={mode === 'edit'}
              tripCheck={tripCheck}
              onUseSlot={applySlot}
            />
          )}
          {step === 2 && (
            <PassengersStep
              values={values}
              setField={setField}
              errors={errors}
              needsJustification={needsJustification || result?.warnings?.length > 0}
            />
          )}
          {step === 3 && (
            <ReviewStep
              values={values}
              original={mode === 'edit' ? initial.values : null}
              changes={changes}
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
              <Button variant="secondary" onClick={onCancel}>
                Annuler
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => goTo(step - 1)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Retour
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleContinue}>
                {step === 1 ? 'Continuer vers les passagers' : mode === 'edit' ? 'Vérifier les changements' : 'Vérifier la demande'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : mode === 'edit' ? (
              <Button onClick={handleSend} loading={sending} disabled={!canSend}>
                <Save className="size-4" aria-hidden="true" /> Enregistrer les modifications
              </Button>
            ) : (
              <Button onClick={handleSend} loading={sending} disabled={!canSend}>
                <Send className="size-4" aria-hidden="true" /> Envoyer la demande
              </Button>
            )}
          </div>
        </Card>

        <RequestSummary values={values} organization={organization} step={step} title={mode === 'edit' ? 'Votre réservation' : 'Votre demande'} />
      </div>
    </>
  )
}
