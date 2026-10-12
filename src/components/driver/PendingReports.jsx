import { ClipboardCheck } from 'lucide-react'
import { usePendingReports } from '../../hooks/usePendingReports'
import { MissionRow } from './MissionRow'

// En tête de « Mes missions » : les trajets dont le compte rendu est attendu (aujourd'hui, ou hier jusqu'à 12:00).
// Rien n'est affiché s'il n'y en a pas (ni pendant le chargement, ni en cas d'erreur : la liste reste utilisable).
export function PendingReports() {
  const pending = usePendingReports()
  if (!pending.data || pending.data.length === 0) return null

  return (
    <section aria-labelledby="comptes-rendus-attendus" className="grid gap-3 rounded-panel border border-warning-line bg-warning-soft p-4">
      <h2 id="comptes-rendus-attendus" className="flex items-center gap-2 text-lg font-bold">
        <ClipboardCheck className="size-5 text-warning" aria-hidden="true" />
        Comptes rendus à faire ({pending.data.length})
      </h2>
      <p className="text-sm">
        Indiquez pour chaque trajet s'il a été réalisé, le jour même de préférence et au plus tard le lendemain à 12:00.
        Ensuite, seul un agent pourra le faire.
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {pending.data.map((mission) => (
          <MissionRow key={mission.id} mission={mission} report={null} />
        ))}
      </ul>
    </section>
  )
}
