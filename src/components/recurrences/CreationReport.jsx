import { CircleAlert, CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatDate } from '../../lib/dates'
import { describeFrequency } from '../../lib/recurrences'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const LONG_DATE = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

// Rapport de création d'une série (meta de POST /recurrences) : trajets créés,
// dates ignorées avant création et dates dont la création a échoué, avec leur motif.
export function CreationReport({ recurrence, report, onRestart }) {
  const headingRef = useRef(null)
  const created = report?.created_count ?? recurrence.reservations_count ?? 0
  const skipped = report?.skipped_dates ?? []
  const failed = report?.failed_dates ?? []
  const Icon = created > 0 ? CircleCheck : CircleAlert

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Card className="mx-auto max-w-2xl p-8">
      <div className="text-center">
        <Icon className={`mx-auto size-11 ${created > 0 ? 'text-success' : 'text-danger'}`} aria-hidden="true" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-xl font-bold outline-none">
          {created > 0 ? 'Votre série a bien été créée' : 'Aucun trajet n’a pu être créé'}
        </h2>
        <p className="mt-2 text-muted">
          {describeFrequency(recurrence)} · {created > 1 ? `${created} trajets créés` : `${created} trajet créé`}
          {skipped.length > 0 && ` · ${skipped.length > 1 ? `${skipped.length} dates ignorées` : '1 date ignorée'}`}
          {failed.length > 0 && ` · ${failed.length > 1 ? `${failed.length} dates en échec` : '1 date en échec'}`}
        </p>
      </div>

      {failed.length > 0 && (
        <ReportList title="Trajets non créés" items={failed} className="border-danger bg-danger-soft text-danger" />
      )}
      {skipped.length > 0 && <ReportList title="Dates ignorées" items={skipped} className="border-line bg-surface-muted" />}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button to={`/espace/recurrences/${recurrence.id}`}>Voir la série</Button>
        <Button variant="secondary" to="/espace/recurrences">
          Récurrences
        </Button>
        <Button variant="link" onClick={onRestart}>
          Nouvelle récurrence
        </Button>
      </div>
    </Card>
  )
}

function ReportList({ title, items, className }) {
  return (
    <section className={`mt-5 rounded-[10px] border p-4 text-sm ${className}`}>
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
