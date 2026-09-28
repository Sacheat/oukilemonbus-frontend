import { ArrowRight, ArrowUpRight, CalendarDays } from 'lucide-react'
import { getNextTrip } from '../../api/reservations'
import { useAuth } from '../../auth/useAuth'
import { NextTripCard } from '../../components/reservations/NextTripCard'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'

// Accueil de l'espace demandeur (maquette 01 : accueil orienté action)
export function UserHomePage() {
  const { user, can } = useAuth()
  const hasOrganization = user.organizations?.length > 0
  const nextTrip = useApi(fetchNextTrip)

  return (
    <>
      <PageHeader eyebrow="Espace demandeur" title={`Bonjour ${user.first_name}`} description="Que souhaitez-vous faire aujourd’hui ?" />

      {!hasOrganization && (
        <Alert tone="warning" title="Rejoignez une organisation pour réserver" className="mb-5">
          <p>Les réservations se font au nom d’une organisation (école, ASBL, CPAS…).</p>
          <Button variant="link" to="/espace/organisations" className="text-sm">
            Rejoindre ou créer une organisation →
          </Button>
        </Alert>
      )}

      <div className="grid gap-4.5 md:grid-cols-[1.25fr_1fr]">
        <article className="flex min-h-[205px] items-end justify-between gap-4 rounded-panel bg-nav p-7 text-white dark:border dark:border-line">
          <div>
            <p className="text-[11px] font-extrabold tracking-[.13em] text-accent uppercase">Votre prochaine étape</p>
            <h2 className="mt-2 text-[23px] leading-tight font-bold">Organiser un déplacement</h2>
            <p className="mt-2 mb-4.5 max-w-[390px] text-sm text-nav-ink">
              Indiquez le trajet et les passagers. Nous vous guidons jusqu’à l’envoi de la demande.
            </p>
            {can('reservations.create') && hasOrganization ? (
              <Button variant="accent" to="/espace/reservations/nouvelle">
                Créer une réservation <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <p className="text-sm font-bold text-accent">Rejoignez d’abord une organisation.</p>
            )}
          </div>
          <ArrowUpRight className="hidden size-18 shrink-0 text-[#6787b7] sm:block" aria-hidden="true" />
        </article>

        <Card as="article" className="flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Suivre une demande</h2>
            <p className="mt-2 text-muted">Retrouvez les confirmations, les décisions et le détail de vos trajets.</p>
          </div>
          <Button variant="secondary" to="/espace/deplacements" className="self-start">
            Voir mes déplacements <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Card>
      </div>

      <h2 className="mt-7 mb-3 text-base font-bold">Votre prochain trajet</h2>
      {nextTrip.loading && !nextTrip.data ? (
        <Loader />
      ) : nextTrip.error ? (
        <ErrorState error={nextTrip.error} onRetry={nextTrip.reload} />
      ) : nextTrip.data ? (
        <NextTripCard reservation={nextTrip.data} />
      ) : (
        <Card className="flex items-center gap-3 text-muted">
          <CalendarDays className="size-5 shrink-0" aria-hidden="true" />
          Aucun trajet prévu pour le moment.
        </Card>
      )}
    </>
  )
}

function fetchNextTrip(signal) {
  return getNextTrip({ signal })
}
