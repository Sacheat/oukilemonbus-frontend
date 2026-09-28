import { LoaderCircle } from 'lucide-react'
import { cx } from '../../lib/cx'

export function Loader({ label = 'Chargement…', className }) {
  return (
    <div role="status" className={cx('flex items-center gap-2 text-sm text-muted', className)}>
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Loader />
    </div>
  )
}
