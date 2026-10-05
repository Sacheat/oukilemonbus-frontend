import { ArrowRight } from 'lucide-react'
import { greeting } from '../../lib/home'
import { trackSpotlight } from '../../lib/spotlight'
import { BusRoute } from '../home/BusRoute'
import { Button } from '../ui/Button'

// Bannière de l'accueil chauffeur, dans le style des autres espaces : salutation, date du jour, et le bouton jaune
// « Ma journée » (trajets du jour avec leurs boutons Départ / Arrivée et « Aide »).
// `todayLabel` : date du jour en toutes lettres ; `todayCount` : nombre de missions du jour (undefined : inconnu).
export function DriverHero({ firstName, todayLabel, todayCount }) {
  return (
    <section
      aria-labelledby="driver-home-title"
      onPointerMove={trackSpotlight}
      className="spotlight spotlight-warm overflow-hidden rounded-panel bg-hero px-6 py-7 text-white shadow-soft sm:px-9 sm:py-9"
    >
      <div aria-hidden="true" className="texture-dots absolute inset-0 -z-10" />
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.14em] text-accent uppercase">Espace chauffeur</p>
          <h1 id="driver-home-title" className="mt-2 text-[30px] leading-tight font-bold tracking-tight sm:text-[36px]">
            {greeting()} {firstName}
          </h1>
          <p className="mt-2 max-w-md text-nav-ink first-letter:uppercase">
            {todayLabel}
            {todayCount !== undefined &&
              (todayCount === 0 ? ' · pas de mission aujourd’hui' : ` · ${todayCount} mission${todayCount > 1 ? 's' : ''} aujourd’hui`)}
          </p>
          <div className="mt-6">
            <Button variant="accent" to="/chauffeur/journee" className="min-h-12 px-5 text-lg shadow-lg shadow-black/20">
              Ma journée <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <BusRoute className="hidden lg:block" />
      </div>
    </section>
  )
}
