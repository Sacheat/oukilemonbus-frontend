import { Check, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { deactivateLocality, updateLocality } from '../../api/municipalities'
import { cx } from '../../lib/cx'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { localitySourceLabel } from '../../lib/municipalities'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'

// Une localité : nom (renommable sur place), origine, état, et désactiver / réactiver.
// `onChanged(message)` après un succès ; l'erreur reste affichée sur la ligne.
export function LocalityRow({ locality, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(locality.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function run(action, message) {
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged(message)
    } catch (err) {
      setError(getFieldErrors(err).name ?? getErrorMessage(err))
      setBusy(false)
    }
  }

  function rename(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === locality.name) {
      setEditing(false)
      return
    }
    run(() => updateLocality(locality.id, { name: trimmed }), `Localité renommée : ${trimmed}.`)
  }

  return (
    <li className={cx('grid gap-1.5 px-5 py-2.5', !locality.is_active && 'bg-surface-muted')}>
      {editing ? (
        <form onSubmit={rename} className="flex flex-wrap items-center gap-2">
          <Input
            aria-label={`Nouveau nom de ${locality.name}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            autoFocus
            className="min-w-0 flex-1 py-2 text-sm"
          />
          <Button type="submit" variant="secondary" loading={busy} aria-label="Enregistrer le nom">
            <Check className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setEditing(false)
              setName(locality.name)
              setError(null)
            }}
            aria-label="Annuler le renommage"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx('min-w-0 flex-1 font-semibold break-words', !locality.is_active && 'text-muted line-through')}>
            {locality.name}
          </span>
          <Badge tone="neutral">{localitySourceLabel(locality.source)}</Badge>
          {!locality.is_active && <Badge tone="warning">Désactivée</Badge>}
          <Button variant="secondary" onClick={() => setEditing(true)} aria-label={`Renommer ${locality.name}`} className="px-3">
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          {locality.is_active ? (
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => run(() => deactivateLocality(locality.id), `Localité désactivée : ${locality.name}.`)}
            >
              Désactiver
            </Button>
          ) : (
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => run(() => updateLocality(locality.id, { is_active: true }), `Localité réactivée : ${locality.name}.`)}
            >
              Réactiver
            </Button>
          )}
        </div>
      )}
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </li>
  )
}
