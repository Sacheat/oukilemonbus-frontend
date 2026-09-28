import { ACTIVITY_TYPE_LABELS } from '../../../lib/labels'
import { Field, Input, Select, Textarea } from '../../ui/Field'

// Étape 2 : passagers, activité et motif
export function PassengersStep({ values, setField, errors, needsJustification }) {
  return (
    <div className="grid gap-4.5 sm:grid-cols-2">
      <Field label="Nombre d’enfants" required error={errors.nb_children}>
        {(props) => (
          <Input {...props} type="number" min={0} inputMode="numeric" value={values.nb_children} onChange={(event) => setField('nb_children', event.target.value)} />
        )}
      </Field>
      <Field label="Nombre d’adultes" required hint="Au moins un adulte accompagnant." error={errors.nb_adults}>
        {(props) => (
          <Input {...props} type="number" min={1} inputMode="numeric" value={values.nb_adults} onChange={(event) => setField('nb_adults', event.target.value)} />
        )}
      </Field>
      <Field label="Type d’activité" error={errors.activity_type} className="sm:col-span-2">
        {(props) => (
          <Select {...props} value={values.activity_type} onChange={(event) => setField('activity_type', event.target.value)}>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        label="Motif du déplacement"
        required
        hint={
          needsJustification
            ? 'Votre trajet nécessite une dérogation : expliquez ici pourquoi ces horaires sont nécessaires.'
            : 'Par exemple : sortie à la piscine, visite du musée…'
        }
        error={errors.trip_purpose}
        className="sm:col-span-2"
      >
        {(props) => (
          <Textarea {...props} maxLength={500} value={values.trip_purpose} onChange={(event) => setField('trip_purpose', event.target.value)} />
        )}
      </Field>
    </div>
  )
}
