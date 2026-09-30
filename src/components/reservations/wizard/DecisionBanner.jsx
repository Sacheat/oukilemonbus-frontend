import { CircleCheck, CircleX, Landmark, TriangleAlert } from 'lucide-react'
import { cx } from '../../../lib/cx'

const TONES = {
  success: { box: 'border-success/30 bg-success-soft', badge: 'bg-success text-on-primary', icon: CircleCheck },
  info: { box: 'border-info/30 bg-info-soft', badge: 'bg-info text-on-primary', icon: Landmark },
  warning: { box: 'border-warning-line bg-warning-soft', badge: 'bg-warning text-on-primary', icon: TriangleAlert },
  danger: { box: 'border-danger/30 bg-danger-soft', badge: 'bg-danger text-on-danger', icon: CircleX },
}

// Bandeau mis en avant en tête de la vérification : ce que deviendra la demande
// (`decision` = { tone, title, text }, voir reservationDecision et seriesDecision)
export function DecisionBanner({ decision, eyebrow = 'Après l’envoi' }) {
  const { tone, title, text } = decision
  const { box, badge, icon: Icon } = TONES[tone]

  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('flex items-start gap-4 rounded-card border p-5', box)}>
      <span aria-hidden="true" className={cx('grid size-11 shrink-0 place-items-center rounded-full', badge)}>
        <Icon className="size-5.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold tracking-[.13em] text-muted uppercase">{eyebrow}</p>
        <p className="mt-0.5 text-lg leading-snug font-bold">{title}</p>
        <p className="mt-1 text-sm">{text}</p>
      </div>
    </div>
  )
}
