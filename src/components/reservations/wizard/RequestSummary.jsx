import { Card } from '../../ui/Card'
import { BookingNote } from './BookingNote'
import { RequestTicket } from './RequestTicket'

// Colonne de droite de la maquette 03 (grand écran) : mini-billet de la demande en cours, qui reste
// visible en défilant, puis l'encart « À savoir ». Sur mobile, voir RequestSummaryBar.
export function RequestSummary({ values, organization, estimate, step, title = 'Votre demande' }) {
  return (
    <aside className="hidden content-start gap-4 lg:sticky lg:top-6 lg:grid">
      <Card className="overflow-hidden">
        <div className="border-b border-dashed border-line px-5 py-4">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <p className="text-sm text-muted">Étape {Math.min(step, 4)} sur 4</p>
        </div>
        <div className="p-5">
          <RequestTicket values={values} organization={organization} estimate={estimate} />
        </div>
      </Card>
      <BookingNote />
    </aside>
  )
}
