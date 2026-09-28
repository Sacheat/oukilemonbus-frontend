import { cx } from '../../lib/cx'

export function EmptyState({ icon: Icon, title, children, actions, className }) {
  return (
    <div className={cx('rounded-card border border-dashed border-line-strong px-6 py-10 text-center', className)}>
      {Icon && <Icon className="mx-auto mb-3 size-8 text-muted" aria-hidden="true" />}
      <p className="font-bold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
