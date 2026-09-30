import { cx } from '../../lib/cx'

// Forme grise de chargement (classe `skeleton` de index.css) ; donner la taille avec className
export function Skeleton({ className }) {
  return <span aria-hidden="true" className={cx('skeleton block rounded-md', className)} />
}
