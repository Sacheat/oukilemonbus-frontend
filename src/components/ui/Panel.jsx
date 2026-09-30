import { useId } from 'react'

// Carte à bandeau de titre (et lien facultatif à droite), contenu qui remplit la hauteur
// pour que deux cartes côte à côte gardent la même taille
export function Panel({ title, action, children }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      <div className="flex min-h-13 flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-2">
        <h2 id={titleId} className="text-base font-bold">
          {title}
        </h2>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  )
}
