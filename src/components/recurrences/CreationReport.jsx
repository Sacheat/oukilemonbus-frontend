import { ArrowRight, CircleAlert, CircleCheck, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatDate } from '../../lib/dates'
import { Button } from '../ui/Button'
import { SeriesHero } from './SeriesHero'

const LONG_DATE = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

// Écran de fin de création d'une série (meta de POST /recurrences) : bilan, bandeau de la série avec les
// actions, puis dates ignorées avant création et dates dont la création a échoué, avec leur motif.
export function CreationReport({ recurrence, report, onRestart }) {
  const headingRef = useRef(null)
  const created = report?.created_count ?? recurrence.reservations_count ?? 0
  const skipped = report?.skipped_dates ?? []
  const failed = report?.failed_dates ?? []
  const Icon = created > 0 ? CircleCheck : CircleAlert

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  // Heures d'arrivée du bandeau : celles du premier trajet à venir de la série créée
  const reservations = recurrence.reservations ?? []
  const nextTrip = reservations.find((reservation) => reservation.trip_date === recurrence.next_trip_date) ?? reservations[0] ?? null

  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-7 shrink-0 ${created > 0 ? 'text-success' : 'text-danger'}`} aria-hidden="true" />
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
            {created > 0 ? 'Votre série a bien été créée' : 'Aucun trajet n’a pu être créé'}
          </h2>
          <p className="mt-0.5 text-muted">
            {created > 1 ? `${created} trajets créés` : `${created} trajet créé`}
            {skipped.length > 0 && ` · ${skipped.length > 1 ? `${skipped.length} dates ignorées` : '1 date ignorée'}`}
            {failed.length > 0 && ` · ${failed.length > 1 ? `${failed.length} dates en échec` : '1 date en échec'}`}
          </p>
        </div>
      </div>

      <SeriesHero recurrence={recurrence} nextTrip={nextTrip} eyebrow="Votre série" titleAs="h3">
        <Button variant="accent" to={`/espace/recurrences/${recurrence.id}`}>
          Voir la série <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <Button variant="secondary" onClick={onRestart}>
          <Plus className="size-4" aria-hidden="true" /> Nouvelle récurrence
        </Button>
      </SeriesHero>

      {failed.length > 0 && <ReportList title="Trajets non créés" items={failed} className="border-danger bg-danger-soft text-danger" />}
      {skipped.length > 0 && <ReportList title="Dates ignorées" items={skipped} className="border-line bg-surface" />}

      <div>
        <Button variant="link" to="/espace/recurrences">
          Voir toutes les récurrences
        </Button>
      </div>
    </div>
  )
}

function ReportList({ title, items, className }) {
  return (
    <section className={`rounded-[10px] border p-4 text-sm ${className}`}>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => (
          <li key={item.date}>
            <span className="font-semibold first-letter:uppercase">{formatDate(item.date, LONG_DATE)}</span> : {item.reason}
          </li>
        ))}
      </ul>
    </section>
  )
}
