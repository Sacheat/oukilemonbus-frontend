import { Card } from '../../components/ui/Card'

// Carte des pages d'authentification (layout public)
export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <>
      <Card className="p-7">
        {eyebrow && <p className="text-[11px] font-extrabold tracking-[.13em] text-link uppercase">{eyebrow}</p>}
        <h1 className="mt-2 text-[27px] leading-tight font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </Card>
      {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
    </>
  )
}
