import { formatDate } from '../../../lib/dates'
import { shortAddress } from '../../../lib/reservations'
import { Card } from '../../ui/Card'

// Colonne de droite de la maquette 03 : récapitulatif de la demande en cours
export function RequestSummary({ values, organization, step }) {
  const passengers = values.nb_adults ? Number(values.nb_children || 0) + Number(values.nb_adults) : null
  return (
    <aside className="grid content-start gap-4">
      <Card className="p-5">
        <h2 className="text-[17px] font-bold">Votre demande</h2>
        <p className="text-sm text-muted">Étape {Math.min(step, 4)} sur 4</p>
        <div className="mt-3 grid gap-2 text-sm">
          {organization && <p>{organization.name}</p>}
          {values.trip_date && (
            <p className="font-bold">
              {formatDate(values.trip_date, { day: 'numeric', month: 'long' })}
              {values.departure_time && ` · ${values.departure_time}`}
            </p>
          )}
          {(values.pickup || values.destination) && (
            <p>
              {values.pickup ? shortAddress(values.pickup) : '…'} → {values.destination ? shortAddress(values.destination) : '…'}
            </p>
          )}
          {passengers && <p>{passengers} passagers</p>}
          {!organization && !values.trip_date && !values.pickup && <p className="text-muted">Rien de renseigné pour l’instant.</p>}
        </div>
      </Card>
      <div className="rounded-[10px] border border-warning-line bg-warning-soft p-4 text-sm">
        <strong>À savoir</strong>
        <p className="mt-1">
          La disponibilité du bus est vérifiée avant l’envoi. Vous suivrez ensuite l’avancement de la demande dans
          « Mes déplacements ».
        </p>
      </div>
    </aside>
  )
}
