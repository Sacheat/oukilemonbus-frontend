import { cx } from '../../lib/cx'
import { Card } from './Card'
import { Logo } from './Logo'

// Page de message (404, accès refusé…). `fullScreen` quand elle est rendue hors layout.
export function MessagePage({ icon: Icon, title, fullScreen = false, children, actions }) {
  const content = (
    <Card className="mx-auto max-w-lg p-8 text-center">
      {Icon && (
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-soft text-link">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="mt-2 text-muted">{children}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </Card>
  )

  if (!fullScreen) return <div className="py-10">{content}</div>

  return (
    <div className={cx('flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10')}>
      <Logo />
      <div className="w-full">{content}</div>
    </div>
  )
}
