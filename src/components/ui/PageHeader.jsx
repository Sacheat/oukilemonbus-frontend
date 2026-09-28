import { cx } from '../../lib/cx'

// En-tête de page de la DA : sur-titre, titre, description et actions à droite
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cx('flex flex-wrap items-center justify-between gap-5 pb-7', className)}>
      <div>
        {eyebrow && <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">{eyebrow}</p>}
        <h1 className="mt-2 text-[27px] leading-tight font-bold tracking-tight sm:text-[31px]">{title}</h1>
        {description && <p className="mt-2 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
