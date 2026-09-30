import { PROOF_ACCEPT } from '../../lib/organizations'
import { Field, FileInput } from '../ui/Field'

// Justificatif facultatif d'un formulaire de demande (envoyé juste après la demande)
export function ProofField({ hint, error, onChange, className }) {
  return (
    <Field label="Justificatif" hint={`${hint} PDF, JPG ou PNG, 5 Mo maximum. Facultatif.`} error={error} className={className}>
      {(props) => <FileInput {...props} accept={PROOF_ACCEPT} onChange={(event) => onChange(event.target.files[0] ?? null)} />}
    </Field>
  )
}
