import { useAuth } from '../auth/useAuth'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

// Accueil provisoire de chaque espace
export function SpaceHomePage({ eyebrow }) {
  const { user } = useAuth()
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={`Bonjour ${user.first_name} 👋`} description="Que souhaitez-vous faire aujourd’hui ?" />
      <Card>
        <p className="text-muted">Le tableau de bord de cet espace est en cours de construction.</p>
      </Card>
    </>
  )
}
