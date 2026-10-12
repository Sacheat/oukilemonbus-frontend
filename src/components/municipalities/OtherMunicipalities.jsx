import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { ActivateMunicipalityModal } from './ActivateMunicipalityModal'
import { MunicipalityCreateModal } from './MunicipalityCreateModal'

function localitiesText(count) {
  return count === 0 ? 'Aucune localité' : `${count} localité${count > 1 ? 's' : ''}`
}

// Communes inactives (admin) : ajout et activation, rares, qui changent les règles de toute la plateforme.
// `others` : communes inactives de la page affichée ; `current` : commune active ou null ; `notice` : message après le
// dernier ajout ou la dernière activation.
export function OtherMunicipalities({ others, current, notice, onChanged }) {
  const [creating, setCreating] = useState(false)
  const [activating, setActivating] = useState(null)

  return (
    <Panel
      title="Autres communes"
      action={
        <Button variant="secondary" onClick={() => setCreating(true)} className="text-sm">
          <Plus className="size-4" aria-hidden="true" /> Ajouter une commune
        </Button>
      }
    >
      {notice && (
        <div className="border-b border-line p-5">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      {others.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">
          Aucune autre commune. Ajoutez-en une pour installer la plateforme dans une autre commune.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {others.map((municipality) => (
            <li key={municipality.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{municipality.name}</span>
                <span className="block text-muted">
                  {[municipality.postal_code, localitiesText(municipality.localities?.length ?? 0)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <Button variant="secondary" onClick={() => setActivating(municipality)}>
                Activer
              </Button>
            </li>
          ))}
        </ul>
      )}

      <MunicipalityCreateModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(created) => {
          setCreating(false)
          onChanged(`Commune ajoutée : ${created.name}. Elle reste inactive tant que vous ne l’activez pas.`)
        }}
      />
      <ActivateMunicipalityModal
        municipality={activating}
        current={current}
        onClose={() => setActivating(null)}
        onActivated={(activated) => {
          setActivating(null)
          onChanged(`Commune active : ${activated.name}. Vérifiez son dépôt, ses distances et synchronisez ses localités.`)
        }}
      />
    </Panel>
  )
}
