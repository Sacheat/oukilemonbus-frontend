import axios from 'axios'
import { useEffect, useState } from 'react'
import { getFieldErrors } from '../lib/errors'

const DEBOUNCE_MS = 700
const identity = (result) => result

// Appelle `check(payload, { signal })` en direct pendant la saisie, 700 ms après la dernière
// modification. `payload` : objet à vérifier, ou null tant que la saisie est incomplète.
// `check` et `transform` doivent être stables (fonctions définies hors du composant).
// Renvoie { pending, result, fieldErrors, error } pour le payload courant uniquement.
export function useLiveCheck(check, payload, transform = identity) {
  const key = payload ? JSON.stringify(payload) : null
  const [state, setState] = useState({ key: null, result: null, fieldErrors: {}, error: null })

  useEffect(() => {
    if (!key) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const current = JSON.parse(key)
      check(current, { signal: controller.signal })
        .then((result) => setState({ key, result: transform(result, current), fieldErrors: {}, error: null }))
        .catch((error) => {
          if (axios.isCancel(error)) return
          setState({ key, result: null, fieldErrors: getFieldErrors(error), error })
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, check, transform])

  if (!key) return { pending: false, result: null, fieldErrors: {}, error: null }
  if (state.key !== key) return { pending: true, result: null, fieldErrors: {}, error: null }
  return { pending: false, result: state.result, fieldErrors: state.fieldErrors, error: state.error }
}
