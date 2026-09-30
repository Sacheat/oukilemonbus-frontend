import { ChevronDown } from 'lucide-react'
import { formatDate } from '../../../lib/dates'
import { BookingNote } from './BookingNote'
import { RequestTicket } from './RequestTicket'

// Récapitulatif sur mobile et tablette : barre compacte au-dessus du formulaire (date et trajet en une
// ligne), qui se déplie pour afficher le mini-billet et l'encart « À savoir ». Masquée en grand écran,
// où RequestSummary prend le relais.
export function RequestSummaryBar({ values, organization, estimate, step, title = 'Votre demande' }) {
  const route = [values.pickup?.city, values.destination?.city].filter(Boolean).join(' → ')
  const line = [values.trip_date && formatDate(values.trip_date, { day: 'numeric', month: 'short' }), route]
    .filter(Boolean)
    .join(' · ')

  return (
    <details className="group mb-5 rounded-card border border-line bg-surface shadow-soft lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">
            {title} <span className="font-normal text-muted">· étape {Math.min(step, 4)} sur 4</span>
          </span>
          {line && <span className="block truncate text-sm text-muted">{line}</span>}
        </span>
        <span className="text-sm font-bold text-link group-open:hidden">Voir</span>
        <span className="hidden text-sm font-bold text-link group-open:inline">Masquer</span>
        <ChevronDown className="size-5 shrink-0 text-link transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid gap-4 border-t border-dashed border-line p-4">
        <RequestTicket values={values} organization={organization} estimate={estimate} />
        <BookingNote />
      </div>
    </details>
  )
}
