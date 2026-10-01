import { Check, Landmark, Pencil, RefreshCw, TriangleAlert, UserRoundCog, X } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import { conflictActions, conflictGuide } from '../../lib/conflicts'
import { Button } from '../ui/Button'
import { OverlapDetails } from './OverlapDetails'

const TONES = {
  conflict: 'border-conflict/40 bg-conflict-soft [&_h4_svg]:text-conflict',
  warning: 'border-warning-line bg-warning-soft [&_h4_svg]:text-warning',
  info: 'border-info/30 bg-info-soft [&_h4_svg]:text-info',
}

// Un conflit ouvert dans le panneau de la file : type, message du backend, ce qui le règle (lib/conflicts) et les
// actions utiles maintenant. Chevauchement : la réservation en face et la frise des créneaux.
// `onAction(nom)` : assign, retryAssign, council, reject (comme les boutons du panneau) ; `onResolve(conflit)` ;
// `editHref` : page de modification ; `onOpen(id)` : ouvrir une autre réservation dans la file.
export function ConflictCard({ conflict, reservation, actions, onAction, onResolve, resolving, busy, editHref, onOpen }) {
  const guide = conflictGuide(conflict)
  const available = conflictActions(conflict, actions)
  const disabled = busy !== null || resolving !== null

  const buttons = {
    assign: (
      <Button key="assign" variant="secondary" className="text-sm" onClick={() => onAction('assign')} disabled={disabled}>
        <UserRoundCog className="size-4" aria-hidden="true" /> Affecter
      </Button>
    ),
    retryAssign: (
      <Button key="retryAssign" variant="secondary" className="text-sm" onClick={() => onAction('retryAssign')} loading={busy === 'retryAssign'} disabled={disabled}>
        <RefreshCw className="size-4" aria-hidden="true" /> Affectation auto
      </Button>
    ),
    council: (
      <Button key="council" variant="secondary" className="text-sm" onClick={() => onAction('council')} disabled={disabled}>
        <Landmark className="size-4" aria-hidden="true" /> Décision du Collège
      </Button>
    ),
    edit: (
      <Link
        key="edit"
        to={editHref}
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-muted"
      >
        <Pencil className="size-4" aria-hidden="true" /> Modifier
      </Link>
    ),
    reject: (
      <Button key="reject" variant="secondary" className="text-sm text-danger" onClick={() => onAction('reject')} disabled={disabled}>
        <X className="size-4" aria-hidden="true" /> Refuser
      </Button>
    ),
    resolve: (
      <Button key="resolve" variant="secondary" className="text-sm" onClick={() => onResolve(conflict)} loading={resolving === conflict.id} disabled={disabled}>
        <Check className="size-4" aria-hidden="true" /> {guide.resolveLabel ?? 'Marquer comme résolu'}
      </Button>
    ),
  }

  return (
    <li className={cx('grid gap-2.5 rounded-card border p-3.5 text-sm', TONES[guide.tone] ?? TONES.warning)}>
      <h4 className="flex items-center gap-2 font-bold">
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
        {conflict.type_label}
      </h4>
      <p>{conflict.message}</p>
      {guide.explanation && <p className="text-muted">{guide.explanation}</p>}
      {conflict.type === 'schedule_overlap' && conflict.related_reservation_id && (
        <OverlapDetails reservation={reservation} relatedId={conflict.related_reservation_id} onOpen={onOpen} />
      )}
      {available.length > 0 && <div className="flex flex-wrap gap-2">{available.map((name) => buttons[name])}</div>}
    </li>
  )
}
