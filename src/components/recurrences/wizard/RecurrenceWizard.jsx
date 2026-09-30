import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createRecurrence, previewRecurrence } from '../../../api/recurrences'
import { useRecurrencePreview, useRecurrenceTripCheck } from '../../../hooks/useRecurrenceChecks'
import { clearDraft, saveDraft } from '../../../lib/drafts'
import { getErrorMessage, getFieldErrors } from '../../../lib/errors'
import {
  mapRecurrenceErrors,
  missingRecurrenceFields,
  recurrenceStepOfField,
  toRecurrencePayload,
} from '../../../lib/recurrences'
import { capacityError } from '../../../lib/reservationForm'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PageHeader } from '../../ui/PageHeader'
import { PassengersStep } from '../../reservations/wizard/PassengersStep'
import { StepIndicator } from '../../reservations/wizard/StepIndicator'
import { TripStep } from '../../reservations/wizard/TripStep'
import { CalendarStep } from './CalendarStep'
import { RecurrenceReviewStep } from './RecurrenceReviewStep'
import { RecurrenceSummary } from './RecurrenceSummary'

const STEPS = ['Trajet', 'Calendrier', 'Passagers', 'Vérification']
const TITLES = { 1: 'Commençons par le trajet', 2: 'Quand a lieu ce trajet ?', 3: 'Qui voyage ?', 4: 'Vérifiez votre série' }
const CARD_TITLES = { 1: 'Où et à quelle heure ?', 2: 'Fréquence et période', 3: 'Passagers et motif', 4: 'Récapitulatif' }
const INTROS = {
  1: 'Renseignez les lieux et les horaires, identiques pour chaque trajet de la série.',
  2: 'Choisissez les jours et la période : les dates prévues s’affichent au fur et à mesure.',
  3: 'Indiquez le nombre de passagers et la raison du déplacement.',
  4: 'Relisez les informations avant l’envoi.',
}
const CONTINUE_LABELS = { 1: 'Continuer vers le calendrier', 2: 'Continuer vers les passagers', 3: 'Vérifier la série' }
const CALENDAR_FIELDS = ['frequency', 'days_of_week', 'start_date', 'end_date']
const IDLE_PREVIEW = { status: 'idle', result: null, error: null }

// Assistant de création d'une série (écoles et personnel communal), sur le modèle de la maquette 03.
// `draft` = { name, userId } pour le brouillon, `onDone({ recurrence, report })` après la création.
export function RecurrenceWizard({ initial, organizations, draft, onDone, onCancel, onRestart }) {
  const [values, setValues] = useState(initial.values)
  const [step, setStep] = useState(initial.step ?? 1)
  const [restored, setRestored] = useState(Boolean(initial.restored))
  // Clé d'idempotence liée au corps envoyé, réutilisée si on renvoie la même série
  const [idempotency, setIdempotency] = useState(initial.idempotency ?? null)
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(IDLE_PREVIEW)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const headingRef = useRef(null)
  const tripCheck = useRecurrenceTripCheck(values, step === 1)
  // Aperçu en direct à l'étape Calendrier, gardé à l'étape Passagers (même corps, pas de nouvel appel)
  // pour la capacité du bus (max_passengers)
  const livePreview = useRecurrencePreview(values, step === 2 || step === 3)

  const organization = organizations.find((item) => String(item.id) === String(values.organization_id))
  const tripCount = (step === 4 ? preview.result : livePreview.result)?.total_valid_occurrences ?? null

  // Brouillon enregistré à chaque modification ; rien tant que la saisie n'a pas bougé
  // (sinon un formulaire vide serait « repris » au retour)
  const untouched = values === initial.values && step === (initial.step ?? 1)
  useEffect(() => {
    if (!untouched) saveDraft(draft.name, draft.userId, { values, step, idempotency })
  }, [draft, untouched, values, step, idempotency])

  // Accessibilité : le focus suit le changement d'étape
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
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
    const fieldErrors = mapRecurrenceErrors(getFieldErrors(error))
    const steps = Object.keys(fieldErrors).map(recurrenceStepOfField).filter(Boolean)
    if (steps.length === 0) return false
    setErrors(fieldErrors)
    goTo(Math.min(...steps))
    return true
  }

  async function runPreview(currentValues) {
    setPreview({ status: 'loading', result: null, error: null })
    try {
      setPreview({ status: 'done', result: await previewRecurrence(toRecurrencePayload(currentValues)), error: null })
    } catch (error) {
      if (showApiErrors(error)) setPreview(IDLE_PREVIEW)
      else setPreview({ status: 'error', result: null, error })
    }
  }

  function handleContinue() {
    const missing = missingRecurrenceFields(values, step)
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }
    if (step === 1) {
      if (Object.keys(tripCheck.fieldErrors).length > 0) return // erreurs déjà affichées sous les champs
      goTo(2)
    } else if (step === 2) {
      const calendarErrors = Object.keys(mapRecurrenceErrors(livePreview.fieldErrors)).filter((field) => CALENDAR_FIELDS.includes(field))
      if (calendarErrors.length > 0 || livePreview.result?.total_valid_occurrences === 0) return // déjà signalé sous l'aperçu
      goTo(3)
    } else if (step === 3) {
      // Au-delà des places du plus grand bus (max_passengers), inutile d'aller jusqu'à l'aperçu final
      const tooMany = capacityError(values, livePreview.result?.max_passengers)
      if (tooMany) {
        setErrors(tooMany)
        return
      }
      goTo(4)
      runPreview(values)
    }
  }

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      const payload = toRecurrencePayload(values)
      const hash = JSON.stringify(payload)
      const key = idempotency?.hash === hash ? idempotency.key : crypto.randomUUID()
      setIdempotency({ hash, key })
      const created = await createRecurrence(payload, key)
      clearDraft(draft.name)
      onDone(created)
    } catch (error) {
      if (!showApiErrors(error)) setSendError(getErrorMessage(error))
      setSending(false)
    }
  }

  const canSend = preview.status === 'done' && preview.result?.total_valid_occurrences > 0

  return (
    <>
      <PageHeader
        eyebrow="Nouvelle récurrence"
        title={TITLES[step]}
        description="Une seule demande pour tous les trajets de la série. Vous pourrez tout vérifier avant l’envoi."
        className="pb-6"
      />
      <StepIndicator current={step} onSelect={goTo} steps={STEPS} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card as="section" aria-labelledby="step-title" className="p-5 sm:p-7">
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-[21px] font-bold outline-none">
            {CARD_TITLES[step]}
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted">{INTROS[step]}</p>

          {restored && (
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
              withDate={false}
              tripCheck={tripCheck}
            />
          )}
          {step === 2 && <CalendarStep values={values} setField={setField} errors={errors} preview={livePreview} />}
          {step === 3 && (
            <PassengersStep
              values={values}
              setField={setField}
              errors={errors}
              needsJustification={false}
              maxPassengers={livePreview.result?.max_passengers ?? null}
            />
          )}
          {step === 4 && (
            <RecurrenceReviewStep
              values={values}
              organization={organization}
              preview={preview}
              onRetry={() => runPreview(values)}
              onEditStep={goTo}
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
            {step < 4 ? (
              <Button onClick={handleContinue}>
                {CONTINUE_LABELS[step]}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handleSend} loading={sending} disabled={!canSend}>
                <Send className="size-4" aria-hidden="true" /> Créer la série
              </Button>
            )}
          </div>
        </Card>

        <RecurrenceSummary values={values} organization={organization} step={step} tripCount={tripCount} />
      </div>
    </>
  )
}
