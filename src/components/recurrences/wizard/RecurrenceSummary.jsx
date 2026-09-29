import { formatDate } from '../../../lib/dates'
import { describeFrequency } from '../../../lib/recurrences'
import { shortAddress } from '../../../lib/reservations'
import { Card } from '../../ui/Card'

const SHORT_DATE = { day: 'numeric', month: 'short', year: 'numeric' }

// Colonne de droite : récapitulatif de la série en cours de saisie
export function RecurrenceSummary({ values, organization, step, tripCount }) {
  const passengers = values.nb_adults ? Number(values.nb_children || 0) + Number(values.nb_adults) : null
  const hasDays = values.frequency === 'mensuel' || values.days_of_week.length > 0
  return (
    <aside className="grid content-start gap-4">
      <Card className="p-5">
        <h2 className="text-[17px] font-bold">Votre série</h2>
        <p className="text-sm text-muted">Étape {Math.min(step, 5)} sur 5</p>
        <div className="mt-3 grid gap-2 text-sm">
          {organization && <p>{organization.name}</p>}
          {step > 1 && hasDays && (
            <p className="font-bold">
              {describeFrequency(values)}
              {values.departure_time && ` · ${values.departure_time}`}
            </p>
          )}
          {values.start_date && values.end_date && (
            <p>
              Du {formatDate(values.start_date, SHORT_DATE)} au {formatDate(values.end_date, SHORT_DATE)}
            </p>
          )}
          {tripCount != null && <p>{tripCount > 1 ? `${tripCount} trajets prévus` : `${tripCount} trajet prévu`}</p>}
          {(values.pickup || values.destination) && (
            <p>
              {values.pickup ? shortAddress(values.pickup) : '…'} → {values.destination ? shortAddress(values.destination) : '…'}
            </p>
          )}
          {passengers && <p>{passengers} passagers</p>}
          {!organization && !values.pickup && <p className="text-muted">Rien de renseigné pour l’instant.</p>}
        </div>
      </Card>
      <div className="rounded-[10px] border border-warning-line bg-warning-soft p-4 text-sm">
        <strong>À savoir</strong>
        <p className="mt-1">
          Une réservation est créée pour chaque date retenue. Vous pourrez ensuite modifier ou annuler un trajet seul, ou
          annuler toute la série.
        </p>
      </div>
    </aside>
  )
}
