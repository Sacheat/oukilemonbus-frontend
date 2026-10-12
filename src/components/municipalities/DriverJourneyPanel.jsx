import { getDriverJourneySettings } from '../../api/driverJourney'
import { updateMunicipality } from '../../api/municipalities'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import {
  driverJourneyChanges,
  driverJourneyFormValues,
  MAX_DEPARTURE_WINDOW,
  MIN_DEPARTURE_WINDOW,
} from '../../lib/municipalities'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ChoicePills } from '../ui/ChoicePills'
import { Field, Select } from '../ui/Field'
import { NumberStepper } from '../ui/NumberStepper'
import { Panel } from '../ui/Panel'

// Délai par défaut de la plateforme quand GET /driver-journey/settings n'a pas encore répondu
const FALLBACK_WINDOW = 60

function fetchSettings(signal) {
  return getDriverJourneySettings({ signal })
}

// Réglages de « Ma journée » pour la commune active (admin seulement ; le backend refuse ces champs à un agent) :
// application de navigation ouverte par les boutons d'itinéraire, et délai à partir duquel le premier « Départ » est
// possible (par défaut ou personnalisé, comme les distances). Seuls les champs modifiés sont envoyés ; bouton désactivé
// sans changement. `notice` : message après l'enregistrement, masqué dès la modification suivante.
export function DriverJourneyPanel({ municipality, notice, onSaved }) {
  const settings = useApi(fetchSettings)
  const form = useForm(driverJourneyFormValues(municipality))
  const { values } = form
  const engines = settings.data?.navigation_engines ?? []
  const defaultEngine = engines.find((engine) => engine.key === settings.data?.default_navigation_engine)
  const defaultWindow = settings.data?.default_departure_window_minutes ?? FALLBACK_WINDOW
  const changes = driverJourneyChanges(municipality, values)
  const dirty = Object.keys(changes).length > 0

  function changeMode(mode) {
    form.setValues((current) => ({
      ...current,
      departure_mode: mode,
      // Passage en personnalisé : on part de la valeur par défaut plutôt que d'un champ vide
      driver_departure_window_min:
        mode === 'perso' && current.driver_departure_window_min === '' ? String(defaultWindow) : current.driver_departure_window_min,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!dirty) return
    const result = await form.submit(() => updateMunicipality(municipality.id, changes))
    if (result.ok) onSaved(result.data)
  }

  return (
    <Panel title="Espace chauffeur (Ma journée)">
      <form onSubmit={handleSubmit} noValidate className="grid gap-5 p-5">
        {notice && !dirty && <Alert tone="success">{notice}</Alert>}
        {form.error && <Alert tone="danger">{form.error}</Alert>}
        <Field
          label="Application de navigation"
          hint="Ouverte par les boutons « Itinéraire ». Sur Android, le téléphone propose l’application de navigation installée."
          error={form.errors.navigation_engine}
        >
          {(props) => (
            <Select {...props} value={values.navigation_engine} onChange={form.handle('navigation_engine')} className="sm:max-w-sm">
              <option value="">Par défaut{defaultEngine ? ` (${defaultEngine.label})` : ''}</option>
              {engines.map((engine) => (
                <option key={engine.key} value={engine.key}>
                  {engine.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="grid gap-2">
          <ChoicePills
            legend="Premier départ possible"
            hint="Combien de minutes avant l’heure prévue le chauffeur peut signaler son premier départ de la journée."
            options={[
              { value: 'defaut', label: `Par défaut (${defaultWindow} min)` },
              { value: 'perso', label: 'Personnalisé' },
            ]}
            value={values.departure_mode}
            onChange={changeMode}
            error={values.departure_mode === 'perso' ? undefined : form.errors.driver_departure_window_min}
          />
          {values.departure_mode === 'perso' && (
            <Field
              label="Minutes avant l’heure prévue"
              hint={`De ${MIN_DEPARTURE_WINDOW} à ${MAX_DEPARTURE_WINDOW} minutes.`}
              error={form.errors.driver_departure_window_min}
            >
              {(props) => (
                <NumberStepper
                  {...props}
                  value={values.driver_departure_window_min}
                  onChange={(value) => form.setValues((current) => ({ ...current, driver_departure_window_min: value }))}
                  min={MIN_DEPARTURE_WINDOW}
                  max={MAX_DEPARTURE_WINDOW}
                  step={5}
                  decrementLabel="Réduire le délai"
                  incrementLabel="Augmenter le délai"
                />
              )}
            </Field>
          )}
        </div>

        <div className="grid gap-1 rounded-control bg-surface-muted p-3 text-sm">
          <p className="font-semibold">Préparer le téléphone du chauffeur</p>
          <p className="text-muted">
            Installez une application de navigation (Organic Maps, ou Google Maps) et téléchargez-y la carte de la région :
            l’itinéraire reste alors utilisable sans réseau. Autorisez la position pour l’application dans le navigateur.
          </p>
        </div>
        <div>
          <Button type="submit" loading={form.submitting} disabled={!dirty}>
            Enregistrer les réglages chauffeur
          </Button>
        </div>
      </form>
    </Panel>
  )
}
