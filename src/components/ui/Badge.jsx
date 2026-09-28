import { cx } from '../../lib/cx'

const TONES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  conflict: 'bg-conflict-soft text-conflict',
  neutral: 'bg-neutral-soft text-neutral',
}

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cx('inline-block rounded-md px-2.5 py-1 text-xs font-bold', TONES[tone], className)}>
      {children}
    </span>
  )
}
