import { Pencil, Trash2 } from 'lucide-react'
import { periodText } from '../../lib/municipalityCalendar'
import { Button } from '../ui/Button'

// Une période du calendrier : nom, dates en toutes lettres, et pour qui peut gérer : Modifier, Supprimer
export function CalendarPeriodRow({ period, canManage, onEdit, onDelete }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
      <div className="min-w-0">
        <p className="font-semibold">{period.label}</p>
        <p className="text-sm text-muted first-letter:uppercase">{periodText(period)}</p>
      </div>
      {canManage && (
        <div className="flex gap-2">
          <Button variant="secondary" className="text-sm" onClick={onEdit} aria-label={`Modifier ${period.label}`}>
            <Pencil className="size-4" aria-hidden="true" />
            Modifier
          </Button>
          <Button variant="secondary" className="text-sm" onClick={onDelete} aria-label={`Supprimer ${period.label}`}>
            <Trash2 className="size-4" aria-hidden="true" />
            Supprimer
          </Button>
        </div>
      )}
    </li>
  )
}
