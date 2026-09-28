import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

// Construite depuis meta.current_page / meta.last_page / meta.total
// (meta.links contient du HTML, ne pas l'utiliser)
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null
  const { current_page: page, last_page: lastPage, total } = meta

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Page {page} sur {lastPage} · {total} résultat{total > 1 ? 's' : ''}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Précédente
        </Button>
        <Button variant="secondary" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
          Suivante
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
