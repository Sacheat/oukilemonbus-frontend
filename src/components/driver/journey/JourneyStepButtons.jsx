import { Check, Flag, PlayCircle, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cancelLastTripEvent, recordTripEvent } from '../../../api/tripProgress'
import { cx } from '../../../lib/cx'
import { readDevicePosition } from '../../../lib/devicePosition'
import { JOURNEY_STEPS, LAST_STEP, stepStatus } from '../../../lib/driverJourney'
import { getErrorMessage } from '../../../lib/errors'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { FinalArrivalModal } from './FinalArrivalModal'
import { StepConfirmModal } from './StepConfirmModal'

// Les quatre étapes d'un trajet, en deux lignes (aller, retour), avec de gros boutons pour le téléphone sur support :
//   étape enregistrée → bouton éteint, coché, avec son heure (« Parti 09:02 »)
//   étape suivante    → seul bouton actif ; la dernière arrivée demande d'abord les passagers transportés
//   étapes suivantes  → grisées
// Chaque appui relève la position du téléphone (sans bloquer s'il la refuse) ; le backend vérifie l'ordre et l'heure.
// Erreur humaine, double sécurité :
//   appui      → fenêtre « Confirmer … maintenant ? » (la dernière arrivée passe par la fenêtre des passagers)
//   enregistré → « Annuler cet appui » pendant meta.undo_seconds (2 min, annoncé par le backend), puis il disparaît :
//                au-delà, seul un agent peut annuler (le backend refuse aussi)
// `onRecorded(meta, étape)` reçoit l'avancement à jour et le compte rendu créé à la dernière arrivée ;
// `onUndone(meta, étape)` après une annulation.
export function JourneyStepButtons({ mission, progress, disabled, onRecorded, onUndone }) {
  const [busyStep, setBusyStep] = useState(null)
  const [error, setError] = useState(null)
  const [askPassengers, setAskPassengers] = useState(false)
  const [confirmStep, setConfirmStep] = useState(null)
  // Dernier appui annulable : { event, minutes, until } (horloge du téléphone, simple affichage : le backend tranche)
  const [undoable, setUndoable] = useState(null)
  const [undoing, setUndoing] = useState(false)

  useEffect(() => {
    if (!undoable) return undefined
    const timer = setTimeout(() => setUndoable(null), Math.max(0, undoable.until - Date.now()))
    return () => clearTimeout(timer)
  }, [undoable])

  async function record(type, passengers = {}) {
    setBusyStep(type)
    setError(null)
    try {
      const position = await readDevicePosition()
      const result = await recordTripEvent(mission.id, { type, position, ...passengers })
      setAskPassengers(false)
      const seconds = result.meta.undo_seconds
      setUndoable(seconds ? { event: result.data, minutes: Math.round(seconds / 60), until: Date.now() + seconds * 1000 } : null)
      onRecorded(result.meta, result.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyStep(null)
    }
  }

  function handlePress(step) {
    if (step.type === LAST_STEP) setAskPassengers(true)
    else setConfirmStep(step)
  }

  async function undo() {
    setUndoing(true)
    setError(null)
    try {
      const result = await cancelLastTripEvent(mission.id)
      setUndoable(null)
      onUndone?.(result.meta, result.data)
    } catch (err) {
      setUndoable(null)
      setError(getErrorMessage(err))
    } finally {
      setUndoing(false)
    }
  }

  const legs = ['Aller', 'Retour'].map((leg) => ({ leg, steps: JOURNEY_STEPS.filter((step) => step.leg === leg) }))

  return (
    <div className="grid gap-3">
      {legs.map(({ leg, steps }) => (
        <div key={leg} className="grid gap-2">
          <p className="text-xs font-extrabold tracking-[.12em] text-muted uppercase">{leg}</p>
          <div className="grid grid-cols-2 gap-2">
            {steps.map((step) => {
              const { status, event } = stepStatus(progress, step.type)
              const isDeparture = step.type.startsWith('depart')
              const Icon = status === 'done' ? Check : isDeparture ? PlayCircle : Flag
              return (
                <button
                  key={step.type}
                  type="button"
                  onClick={() => handlePress(step)}
                  disabled={disabled || status !== 'next' || busyStep !== null || undoing}
                  aria-label={status === 'done' ? `${step.label} (${leg.toLowerCase()}) : enregistré à ${event.local_time}` : `${step.label} (${leg.toLowerCase()})`}
                  className={cx(
                    'flex min-h-16 items-center justify-center gap-2 rounded-card px-3 text-lg font-extrabold transition',
                    status === 'next' && !disabled && (isDeparture ? 'bg-primary text-on-primary hover:bg-primary-hover' : 'bg-accent text-on-accent hover:brightness-95'),
                    status === 'next' && disabled && 'border border-line-strong bg-surface-muted text-muted',
                    status === 'done' && 'border border-line bg-success-soft text-success',
                    status === 'locked' && 'border border-dashed border-line-strong text-muted opacity-60',
                    'disabled:cursor-not-allowed',
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {status === 'done' ? (
                    <span>
                      {step.doneLabel} <span className="tabular-nums">{event.local_time}</span>
                    </span>
                  ) : busyStep === step.type ? (
                    'Envoi…'
                  ) : (
                    step.label
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {undoable && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-surface-muted p-3 text-sm">
          <span>
            Appuyé par erreur ? Vous pouvez annuler « {undoable.event.type_label} » pendant {undoable.minutes} minute
            {undoable.minutes > 1 ? 's' : ''}.
          </span>
          <Button variant="secondary" loading={undoing} onClick={undo}>
            <Undo2 className="size-4" aria-hidden="true" />
            Annuler cet appui
          </Button>
        </div>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      <StepConfirmModal
        step={confirmStep}
        onCancel={() => setConfirmStep(null)}
        onConfirm={() => {
          const type = confirmStep.type
          setConfirmStep(null)
          record(type)
        }}
      />

      <FinalArrivalModal
        open={askPassengers}
        mission={mission}
        sending={busyStep === LAST_STEP}
        error={askPassengers ? error : null}
        onClose={() => setAskPassengers(false)}
        onConfirm={(passengers) => record(LAST_STEP, passengers)}
      />
    </div>
  )
}
