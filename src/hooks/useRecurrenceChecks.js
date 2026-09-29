import { previewRecurrence } from '../api/recurrences'
import { recurrenceCalendarPayload, toProbeTripPayload } from '../lib/recurrences'
import { useLiveCheck } from './useLiveCheck'
import { useTripCheck } from './useTripCheck'

// Étape 1 d'une récurrence : trajet vérifié sur une date témoin (check-trip exige une date).
// On garde distance, durée et erreurs sur les lieux et horaires ; ce qui dépend de la date
// (disponibilité du bus, erreurs sur trip_date) est retiré : l'étape Calendrier s'en charge.
export function useRecurrenceTripCheck(values, enabled) {
  const check = useTripCheck(enabled ? toProbeTripPayload(values) : null)
  // eslint-disable-next-line no-unused-vars
  const { trip_date: dateError, ...fieldErrors } = check.fieldErrors
  const onlyDateError = Boolean(check.error) && Object.keys(check.fieldErrors).length > 0 && Object.keys(fieldErrors).length === 0
  return {
    pending: check.pending,
    result: check.result && { ...check.result, availability: null },
    fieldErrors,
    error: onlyDateError ? null : check.error,
  }
}

// Étape 2 : aperçu de la série en direct (dates retenues, ignorées, conflits par date)
export function useRecurrencePreview(values, enabled) {
  return useLiveCheck(previewRecurrence, enabled ? recurrenceCalendarPayload(values) : null)
}
