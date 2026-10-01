import { TripReportPanel } from './TripReportPanel'

// Compte rendu dans le détail d'une mission (cahier des charges §3), seulement pour un trajet confirmé :
// le compte rendu n'est chargé (TripReportPanel) que dans ce cas.
export function TripReportSection({ mission }) {
  if (mission.status !== 'confirme') return null

  return (
    <section aria-labelledby="mission-compte-rendu" className="grid gap-3 rounded-card border border-line bg-surface p-4">
      <h2 id="mission-compte-rendu" className="text-lg font-bold">Compte rendu du trajet</h2>
      <TripReportPanel mission={mission} />
    </section>
  )
}
