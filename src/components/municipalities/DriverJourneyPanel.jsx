import { getDriverJourneySettings } from '../../api/driverJourney'
import { updateMunicipality } from '../../api/municipalities'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input, Select } from '../ui/Field'
import { Panel } from '../ui/Panel'

function fetchSettings(signal) {
  return getDriverJourneySettings({ signal })
}

// Réglages de « Ma journée » pour la commune active (admin seulement ; le backend refuse ces champs à un agent) :
// application de navigation ouverte par les boutons d'itinéraire, et délai à partir duquel le premier « Départ » est
// possible. Choix vide = valeur par défaut de la plateforme. `onSaved(municipalité)` après l'enregistrement.
export function DriverJourneyPanel({ municipality, onSaved }) {
  const settings = useApi(fetchSettings)
  const form = useForm({
    navigation_engine: municipality.navigation_engine ?? '',
    driver_departure_window_min: municipality.driver_departure_window_min ?? '',
  })
  const engines = settings.data?.navigation_engines ?? []
  const defaultEngine = engines.find((engine) => engine.key === settings.data?.default_navigation_engine)
  const defaultWindow = settings.data?.default_departure_window_minutes

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) =>
      updateMunicipality(municipality.id, {
        navigation_engine: values.navigation_engine || null,
        driver_departure_window_min: values.driver_departure_window_min === '' ? null : Number(values.driver_departure_window_min),
      }),
    )
    if (result.ok) onSaved(result.data)
  }

  return (
    <Panel title="Espace chauffeur (Ma journée)">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-5">
        {form.error && <Alert tone="danger">{form.error}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Application de navigation"
            hint="Ouverte par les boutons « Itinéraire ». Sur Android, le téléphone propose l’application de navigation installée."
            error={form.errors.navigation_engine}
          >
            {(props) => (
              <Select {...props} value={form.values.navigation_engine} onChange={form.handle('navigation_engine')}>
                <option value="">Par défaut{defaultEngine ? ` (${defaultEngine.label})` : ''}</option>
                {engines.map((engine) => (
                  <option key={engine.key} value={engine.key}>
                    {engine.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="Premier départ possible (minutes avant l’heure prévue)"
            hint={`Entre 0 et 240. Vide : ${defaultWindow ?? 60} minutes (valeur par défaut).`}
            error={form.errors.driver_departure_window_min}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={0}
                max={240}
                value={form.values.driver_departure_window_min}
                onChange={form.handle('driver_departure_window_min')}
              />
            )}
          </Field>
        </div>
        <div className="grid gap-1 rounded-control bg-surface-muted p-3 text-sm">
          <p className="font-semibold">Préparer le téléphone du chauffeur</p>
          <p className="text-muted">
            Installez une application de navigation (Organic Maps, ou Google Maps) et téléchargez-y la carte de la région :
            l’itinéraire reste alors utilisable sans réseau. Autorisez la position pour l’application dans le navigateur.
          </p>
        </div>
        <div>
          <Button type="submit" loading={form.submitting}>
            Enregistrer les réglages chauffeur
          </Button>
        </div>
      </form>
    </Panel>
  )
}
