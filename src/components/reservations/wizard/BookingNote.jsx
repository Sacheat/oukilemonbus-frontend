// Encart « À savoir » de la maquette 03, à côté du récapitulatif de la demande
export function BookingNote() {
  return (
    <div className="rounded-[10px] border border-warning-line bg-warning-soft p-4 text-sm">
      <strong>À savoir</strong>
      <p className="mt-1">
        La disponibilité du bus est vérifiée avant l’envoi. Vous suivrez ensuite l’avancement de la demande dans
        « Mes déplacements ».
      </p>
    </div>
  )
}
