import axios from 'axios'
import { useEffect, useState } from 'react'
import { checkTrip } from '../api/reservations'
import { getFieldErrors } from '../lib/errors'
import { withoutSelfConflicts } from '../lib/reservationForm'

const DEBOUNCE_MS = 700

// Vérifie le trajet en direct pendant la saisie (préavis, week-end, distance, disponibilité…).
// `trip` : corps de check-trip, ou null tant que le trajet est incomplet.
// Renvoie { pending, result, fieldErrors, error } pour le trajet courant uniquement.
export function useTripCheck(trip) {
  const key = trip ? JSON.stringify(trip) : null
  const [state, setState] = useState({ key: null, result: null, fieldErrors: {}, error: null })

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      checkTrip(JSON.parse(key), { signal: controller.signal })
        .then((result) => {
          const trip = JSON.parse(key)
          setState({ key, result: withoutSelfConflicts(result, trip.reservation_id), fieldErrors: {}, error: null })
        })
        .catch((error) => {
          if (axios.isCancel(error)) return
          setState({ key, result: null, fieldErrors: getFieldErrors(error), error })
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key])

  if (!key) return { pending: false, result: null, fieldErrors: {}, error: null }
  if (state.key !== key) return { pending: true, result: null, fieldErrors: {}, error: null }
  return { pending: false, result: state.result, fieldErrors: state.fieldErrors, error: state.error }
}
