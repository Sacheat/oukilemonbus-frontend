import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'
import { cx } from '../../lib/cx'

const TONES = {
  info: { classes: 'border-info/30 bg-info-soft', icon: Info, iconClass: 'text-info' },
  success: { classes: 'border-success/30 bg-success-soft', icon: CircleCheck, iconClass: 'text-success' },
  warning: { classes: 'border-warning-line bg-warning-soft', icon: TriangleAlert, iconClass: 'text-warning' },
  danger: { classes: 'border-danger/30 bg-danger-soft', icon: CircleX, iconClass: 'text-danger' },
}

export function Alert({ tone = 'info', title, className, children }) {
  const { classes, icon: Icon, iconClass } = TONES[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-[10px] border p-4 text-sm text-ink', classes, className)}
    >
      <Icon className={cx('mt-0.5 size-4 shrink-0', iconClass)} aria-hidden="true" />
      <div>
        {title && <strong className="block font-bold">{title}</strong>}
        {children}
      </div>
    </div>
  )
}
