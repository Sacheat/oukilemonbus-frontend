import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

// Page provisoire : à remplacer par la vraie page quand le bloc correspondant est développé
export function ComingSoonPage({ eyebrow, title }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <Card>
        <p className="text-muted">Cette page est en cours de construction.</p>
      </Card>
    </>
  )
}
