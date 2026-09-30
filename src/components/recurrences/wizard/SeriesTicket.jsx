import { CalendarCheck } from 'lucide-react'
import { formatDate } from '../../../lib/dates'
import { describeFrequency, seriesStubDays } from '../../../lib/recurrences'
import { RequestTicket } from '../../reservations/wizard/RequestTicket'

const SHORT_DATE = { day: 'numeric', month: 'short', year: 'numeric' }

// Contenu du mini-billet d'une série en cours de saisie : talon avec les jours, fréquence, période,
// nombre de trajets prévus (aperçu), puis organisation, trajets aller / retour et passagers (RequestTicket)
export function SeriesTicket({ values, organization, estimate, tripCount }) {
  const hasDays = values.frequency === 'mensuel' || values.days_of_week.length > 0
  const days = seriesStubDays(values)

  return (
    <div className="grid gap-4 text-sm">
      {hasDays && (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid w-12 shrink-0 place-content-center gap-0.5 rounded-lg bg-accent py-1.5 text-center leading-none text-on-accent"
          >
            {days.map((day) => (
              <span key={day} className="text-[11px] font-extrabold uppercase">
                {day}
              </span>
            ))}
          </span>
          <div className="min-w-0">
            <p className="font-bold">{describeFrequency(values)}</p>
            {values.start_date && values.end_date && (
              <p className="text-muted">
                Du {formatDate(values.start_date, SHORT_DATE)} au {formatDate(values.end_date, SHORT_DATE)}
              </p>
            )}
          </div>
        </div>
      )}
      {tripCount != null && (
        <p className="flex items-center gap-2 font-semibold">
          <CalendarCheck className="size-4 shrink-0 text-muted" aria-hidden="true" />
          {tripCount > 1 ? `${tripCount} trajets prévus` : `${tripCount} trajet prévu`}
        </p>
      )}
      <RequestTicket values={values} organization={organization} estimate={estimate} />
    </div>
  )
}
