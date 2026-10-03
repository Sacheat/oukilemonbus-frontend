import { Plus, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { addLocality } from '../../api/municipalities'
import { formatDateTime } from '../../lib/dates'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { visibleLocalities } from '../../lib/municipalities'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'
import { Panel } from '../ui/Panel'
import { LocalityRow } from './LocalityRow'
import { SyncLocalitiesModal } from './SyncLocalitiesModal'

// Localités de la commune active (elles disent si un lieu est dans la commune, par exemple pour le score de
// confiance des demandes d'organisation) : filtre local, ajout, renommage, désactivation et synchronisation.
// Toutes arrivent avec la commune : le filtre se fait côté front. `onChanged(message)` après chaque succès.
export function LocalitiesPanel({ municipality, onChanged }) {
  const localities = municipality.localities ?? []
  const activeCount = localities.filter((locality) => locality.is_active).length
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const shown = visibleLocalities(localities, search)

  async function handleAdd(event) {
    event.preventDefault()
    setAdding(true)
    setAddError(null)
    try {
      const locality = await addLocality(municipality.id, newName.trim())
      setNewName('')
      onChanged(`Localité ajoutée : ${locality.name}.`)
    } catch (err) {
      setAddError(getFieldErrors(err).name ?? getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  return (
    <Panel
      title={`Localités · ${activeCount} active${activeCount > 1 ? 's' : ''} sur ${localities.length}`}
      action={
        <Button variant="secondary" onClick={() => setSyncing(true)} className="text-sm">
          <RefreshCw className="size-4" aria-hidden="true" /> Synchroniser avec GeoNames
        </Button>
      }
    >
      <div className="grid items-start gap-4 border-b border-line p-5 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Filtrer les localités"
            placeholder="Filtrer par nom"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="py-2 pl-9 text-sm"
          />
        </div>
        <form onSubmit={handleAdd} className="grid gap-1.5">
          <div className="flex gap-2">
            <Input
              aria-label="Nom de la localité à ajouter"
              aria-invalid={addError ? true : undefined}
              placeholder="Ajouter une localité"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={100}
              className="min-w-0 flex-1 py-2 text-sm"
            />
            <Button type="submit" variant="secondary" loading={adding} disabled={!newName.trim()}>
              <Plus className="size-4" aria-hidden="true" /> Ajouter
            </Button>
          </div>
          {addError && <p className="text-xs font-semibold text-danger">{addError}</p>}
        </form>
      </div>

      {municipality.synced_at && (
        <p className="px-5 pt-3 text-xs text-muted">Dernière synchronisation GeoNames : {formatDateTime(municipality.synced_at)}.</p>
      )}

      {shown.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">
          {localities.length === 0 ? 'Aucune localité : synchronisez avec GeoNames ou ajoutez-en une.' : 'Aucune localité ne correspond.'}
        </p>
      ) : (
        <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">
          {shown.map((locality) => (
            <LocalityRow key={`${locality.id}-${locality.updated_at}`} locality={locality} onChanged={onChanged} />
          ))}
        </ul>
      )}

      <SyncLocalitiesModal
        municipality={municipality}
        open={syncing}
        onClose={() => setSyncing(false)}
        onSynced={(synced) => {
          setSyncing(false)
          const count = synced.localities?.filter((locality) => locality.is_active).length
          onChanged(`Localités synchronisées avec GeoNames${count != null ? ` : ${count} actives` : ''}.`)
        }}
      />
    </Panel>
  )
}
