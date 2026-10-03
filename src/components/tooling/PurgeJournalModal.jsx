import { useCallback, useState } from 'react'
import { getInspectorEntries, purgeInspectorEntries } from '../../api/tooling'
import { useApi } from '../../hooks/useApi'
import { getErrorMessage } from '../../lib/errors'
import { purgeCountParams } from '../../lib/tooling'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Purge définitive du journal : tout, ou les entrées antérieures à un jour choisi (ce jour exclu, heure de Bruxelles). Le nombre concerné est annoncé
// (meta.total du journal filtré pareil) avant de confirmer.
export function PurgeJournalModal({ open, onClose, onPurged }) {
  return (
    <Modal open={open} onClose={onClose} title="Purger le journal">
      {open && <PurgeForm onClose={onClose} onPurged={onPurged} />}
    </Modal>
  )
}

function PurgeForm({ onClose, onPurged }) {
  const [before, setBefore] = useState('')
  const [purging, setPurging] = useState(false)
  const [error, setError] = useState(null)

  const fetchCount = useCallback(
    (signal) => getInspectorEntries(purgeCountParams(before), { signal }).then((page) => page.meta.total),
    [before],
  )
  const count = useApi(fetchCount)

  async function handlePurge() {
    setPurging(true)
    setError(null)
    try {
      onPurged(await purgeInspectorEntries(before || null))
    } catch (err) {
      setError(getErrorMessage(err))
      setPurging(false)
    }
  }

  const total = count.loading ? null : count.data

  return (
    <div className="grid gap-4 text-sm">
      <p>
        Les entrées supprimées ne peuvent pas être récupérées. La purge automatique garde déjà les derniers jours de
        conservation.
      </p>
      <Field label="Supprimer les entrées antérieures au" hint="Ce jour-là exclu. Laisser vide pour tout supprimer.">
        {(props) => <Input {...props} type="date" value={before} onChange={(event) => setBefore(event.target.value)} />}
      </Field>
      <p className="font-semibold" aria-live="polite">
        {total == null ? 'Calcul du nombre d’entrées…' : `${total} ${total > 1 ? 'entrées seront supprimées' : 'entrée sera supprimée'}.`}
      </p>
      {(error || count.error) && <Alert tone="danger">{error ?? getErrorMessage(count.error)}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Retour
        </Button>
        <Button variant="danger" onClick={handlePurge} loading={purging} disabled={!total}>
          Purger
        </Button>
      </div>
    </div>
  )
}
