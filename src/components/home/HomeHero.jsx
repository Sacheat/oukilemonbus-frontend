import { ArrowRight, Repeat, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { greeting } from '../../lib/home'
import { Button } from '../ui/Button'
import { BusRoute } from './BusRoute'

// Bannière de l'accueil usager : salutation selon l'heure, action principale et bus animé
export function HomeHero({ firstName, canBook, canRecur }) {
  return (
    <section
      aria-labelledby="home-title"
      className="relative isolate overflow-hidden rounded-panel bg-hero px-6 py-7 text-white shadow-soft sm:px-9 sm:py-9"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Espace demandeur</p>
          <h1 id="home-title" className="mt-2 text-[30px] leading-tight font-bold tracking-tight sm:text-[36px]">
            {greeting()} {firstName}
          </h1>
          <p className="mt-2 max-w-md text-nav-ink">
            {canBook ? 'Où emmenez-vous votre groupe la prochaine fois ?' : 'Rejoignez une organisation pour réserver le bus communal.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {canBook ? (
              <>
                <Button variant="accent" to="/espace/reservations/nouvelle" className="shadow-lg shadow-black/20">
                  Créer une réservation <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                {canRecur && (
                  <Link
                    to="/espace/recurrences/nouvelle"
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-white/30 px-4 font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
                  >
                    <Repeat className="size-4" aria-hidden="true" /> Nouvelle récurrence
                  </Link>
                )}
              </>
            ) : (
              <Button variant="accent" to="/espace/organisations">
                <UserPlus className="size-4" aria-hidden="true" /> Rejoindre une organisation
              </Button>
            )}
          </div>
        </div>
        <BusRoute className="hidden lg:block" />
      </div>
    </section>
  )
}
