import { saveTripReport } from '../../api/tripReports'
import { useForm } from '../../hooks/useForm'
import { OUTCOME_OPTIONS, tripReportFormValues } from '../../lib/tripReports'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ChoicePills } from '../ui/ChoicePills'
import { Field, Input, Textarea } from '../ui/Field'
import { NumberStepper } from '../ui/NumberStepper'

// Compte rendu du trajet par le chauffeur :
//   « Réalisé »     → heures réelles et passagers réels (pré-remplis avec le prévu), remarque facultative
//   « Non réalisé » → motif obligatoire
// Les règles (qui, jusqu'à quand) sont vérifiées par le backend ; ses erreurs 422 s'affichent sous les champs.
export function TripReportForm({ mission, report, onSaved, onCancel }) {
  const form = useForm(tripReportFormValues(report, mission))
  const realised = form.values.outcome === 'realise'
  const notRealised = form.values.outcome === 'non_realise'

  function setValue(name, value) {
    form.setValues((values) => ({ ...values, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit((values) => saveTripReport(mission.id, values))
    if (result.ok) onSaved(result.data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {form.error && <Alert tone="danger">{form.error}</Alert>}

      <ChoicePills
        legend="Le trajet a-t-il eu lieu ?"
        options={OUTCOME_OPTIONS}
        value={form.values.outcome}
        onChange={(value) => setValue('outcome', value)}
        error={form.errors.outcome}
        required
      />

      {realised && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Départ réel" error={form.errors.actual_departure_time} required>
              {(props) => (
                <Input {...props} type="time" value={form.values.actual_departure_time} onChange={form.handle('actual_departure_time')} />
              )}
            </Field>
            <Field label="Retour réel" error={form.errors.actual_return_time} required>
              {(props) => (
                <Input {...props} type="time" value={form.values.actual_return_time} onChange={form.handle('actual_return_time')} />
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Enfants transportés" error={form.errors.actual_nb_children} required>
              {(props) => (
                <NumberStepper
                  {...props}
                  value={form.values.actual_nb_children}
                  onChange={(value) => setValue('actual_nb_children', value)}
                  decrementLabel="Un enfant de moins"
                  incrementLabel="Un enfant de plus"
                />
              )}
            </Field>
            <Field label="Adultes transportés" error={form.errors.actual_nb_adults} required>
              {(props) => (
                <NumberStepper
                  {...props}
                  value={form.values.actual_nb_adults}
                  onChange={(value) => setValue('actual_nb_adults', value)}
                  decrementLabel="Un adulte de moins"
                  incrementLabel="Un adulte de plus"
                />
              )}
            </Field>
          </div>
        </>
      )}

      {form.values.outcome && (
        <Field
          label={notRealised ? 'Pourquoi le trajet n’a-t-il pas eu lieu ?' : 'Remarque'}
          hint={notRealised ? 'Les agents seront prévenus.' : 'Facultatif. Par exemple : retard, enfant absent.'}
          error={form.errors.remarks}
          required={notRealised}
        >
          {(props) => <Textarea {...props} maxLength={1000} value={form.values.remarks} onChange={form.handle('remarks')} />}
        </Field>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={form.submitting} disabled={!form.values.outcome}>
          Enregistrer le compte rendu
        </Button>
      </div>
    </form>
  )
}
