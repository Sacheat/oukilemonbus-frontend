import { Plus, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { addLocality } from '../../api/municipalities'
import { formatDateTime } from '../../lib/dates'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { LOCALITY_STATES, localityStateCounts, visibleLocalities } from '../../lib/municipalities'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'
import { Panel } from '../ui/Panel'
import { SegmentedControl } from '../ui/SegmentedControl'
import { LocalityRow } from './LocalityRow'
import { SyncLocalitiesModal } from './SyncLocalitiesModal'

// Localités de la commune active (elles disent si un lieu est dans la commune, par exemple pour le score de
// confiance des demandes d'organisation) : filtre local par nom et par état, ajout, renommage, désactivation et
// synchronisation. Toutes arrivent avec la commune : le filtre se fait côté front. `notice` : message après le
// dernier succès ; `onChanged(message)` après chaque succès.
export function LocalitiesPanel({ municipality, notice, onChanged }) {
  const localities = municipality.localities ?? []
  const counts = localityStateCounts(localities)
  const [search, setSearch] = useState('')
  const [state, setState] = useState('toutes')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const shown = visibleLocalities(localities, search, state)

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
      title={`Localités · ${counts.actives} active${counts.actives > 1 ? 's' : ''} sur ${localities.length}`}
      action={
        <Button variant="secondary" onClick={() => setSyncing(true)} className="text-sm">
          <RefreshCw className="size-4" aria-hidden="true" /> Synchroniser avec GeoNames
        </Button>
      }
    >
      <div className="grid gap-4 border-b border-line p-5">
        {notice && <Alert tone="success">{notice}</Alert>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
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
          <SegmentedControl
            label="État des localités"
            options={LOCALITY_STATES.map((option) => ({ ...option, count: counts[option.value] }))}
            value={state}
            onChange={setState}
            className="max-w-full overflow-x-auto"
          />
        </div>
        <form onSubmit={handleAdd} className="grid gap-1.5 sm:max-w-md">
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
