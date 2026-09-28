import { cx } from '../../lib/cx'

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cx('rounded-card border border-line bg-surface p-5.5', className)} {...props}>
      {children}
    </Tag>
  )
}
