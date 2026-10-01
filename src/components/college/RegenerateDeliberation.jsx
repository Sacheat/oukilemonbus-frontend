import { useState } from 'react'
import { regenerateDeliberation } from '../../api/councilDecisions'
import { getErrorMessage } from '../../lib/errors'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'

// Régénérer la délibération PDF (nouvelle version), par exemple après une correction de la référence.
// Partagé par le panneau de la page Collège et celui de la file des réservations (permission documents.generate).
export function RegenerateDeliberation({ decisionId, onDone }) {
  const [state, setState] = useState({ busy: false, message: null, error: null })

  async function handleRegenerate() {
    setState({ busy: true, message: null, error: null })
    try {
      await regenerateDeliberation(decisionId)
      setState({ busy: false, message: 'Nouvelle version de la délibération générée.', error: null })
      onDone()
    } catch (error) {
      setState({ busy: false, message: null, error: getErrorMessage(error) })
    }
  }

  return (
    <div className="grid justify-items-start gap-2">
      <Button variant="secondary" onClick={handleRegenerate} loading={state.busy}>
        Régénérer la délibération
      </Button>
      {state.message && <p className="text-sm text-success">{state.message}</p>}
      {state.error && <Alert tone="danger">{state.error}</Alert>}
    </div>
  )
}
