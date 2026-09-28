import { useCallback, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../lib/errors'

// État d'un formulaire relié au backend :
//   const form = useForm({ email: '' })
//   <Input value={form.values.email} onChange={form.handle('email')} />
//   const result = await form.submit((values) => api.post(…, values))
//   if (result.ok) …
// Les erreurs 422 sont rangées par champ (form.errors) ; une erreur sans champ
// correspondant dans le formulaire (ex. « reservation ») va dans form.error.
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handle = useCallback(
    (field) => (event) => {
      const { type, checked, value } = event.target
      setValues((current) => ({ ...current, [field]: type === 'checkbox' ? checked : value }))
    },
    [],
  )

  async function submit(action) {
    setSubmitting(true)
    setError(null)
    setErrors({})
    try {
      return { ok: true, data: await action(values) }
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      const otherField = Object.keys(fieldErrors).find((field) => !(field in values))
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) setError(getErrorMessage(err))
      else if (otherField) setError(fieldErrors[otherField])
      return { ok: false, error: err }
    } finally {
      setSubmitting(false)
    }
  }

  return { values, setValues, errors, error, submitting, handle, submit }
}
