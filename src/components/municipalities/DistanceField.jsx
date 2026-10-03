import { DEFAULT_DISTANCE_KM, MAX_DISTANCE_KM, MIN_DISTANCE_KM } from '../../lib/municipalities'
import { ChoicePills } from '../ui/ChoicePills'
import { Field } from '../ui/Field'
import { NumberStepper } from '../ui/NumberStepper'

const MODES = [
  { value: 'defaut', label: `Par défaut (${DEFAULT_DISTANCE_KM} km)` },
  { value: 'perso', label: 'Personnalisée' },
]

// Une limite de distance : valeur par défaut du backend (envoyée en null) ou valeur personnalisée de 1 à 500 km.
// `mode` : 'defaut' ou 'perso' ; `value` : texte du nombre. `effective` : valeur appliquée aujourd'hui (effective_max_*).
export function DistanceField({ label, hint, mode, value, onModeChange, onChange, error, effective }) {
  const custom = mode === 'perso'

  return (
    <div className="grid gap-2">
      <ChoicePills
        legend={label}
        hint={hint}
        options={MODES}
        value={mode}
        onChange={onModeChange}
        error={custom ? undefined : error}
      />
      {custom && (
        <Field label="Distance en kilomètres" hint={`De ${MIN_DISTANCE_KM} à ${MAX_DISTANCE_KM} km.`} error={error}>
          {(props) => (
            <NumberStepper
              {...props}
              value={value}
              onChange={onChange}
              min={MIN_DISTANCE_KM}
              max={MAX_DISTANCE_KM}
              decrementLabel="Réduire la distance"
              incrementLabel="Augmenter la distance"
            />
          )}
        </Field>
      )}
      <p className="text-xs text-muted">Appliquée aujourd’hui : {effective} km.</p>
    </div>
  )
}
