import { Check, Flag, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import { recordTripEvent } from '../../../api/tripProgress'
import { cx } from '../../../lib/cx'
import { readDevicePosition } from '../../../lib/devicePosition'
import { JOURNEY_STEPS, LAST_STEP, stepStatus } from '../../../lib/driverJourney'
import { getErrorMessage } from '../../../lib/errors'
import { Alert } from '../../ui/Alert'
import { FinalArrivalModal } from './FinalArrivalModal'

// Les quatre étapes d'un trajet, en deux lignes (aller, retour), avec de gros boutons pour le téléphone sur support :
//   étape enregistrée → bouton éteint, coché, avec son heure (« Parti 09:02 »)
//   étape suivante    → seul bouton actif ; la dernière arrivée demande d'abord les passagers transportés
//   étapes suivantes  → grisées
// Chaque appui relève la position du téléphone (sans bloquer s'il la refuse) ; le backend vérifie l'ordre et l'heure.
// `onRecorded(meta)` reçoit l'avancement à jour et le compte rendu créé à la dernière arrivée.
export function JourneyStepButtons({ mission, progress, disabled, onRecorded }) {
  const [busyStep, setBusyStep] = useState(null)
  const [error, setError] = useState(null)
  const [askPassengers, setAskPassengers] = useState(false)

  async function record(type, passengers = {}) {
    setBusyStep(type)
    setError(null)
    try {
      const position = await readDevicePosition()
      const result = await recordTripEvent(mission.id, { type, position, ...passengers })
      setAskPassengers(false)
      onRecorded(result.meta, result.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyStep(null)
    }
  }

  function handlePress(type) {
    if (type === LAST_STEP) setAskPassengers(true)
    else record(type)
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
                  onClick={() => handlePress(step.type)}
                  disabled={disabled || status !== 'next' || busyStep !== null}
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

      {error && <Alert tone="danger">{error}</Alert>}

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
