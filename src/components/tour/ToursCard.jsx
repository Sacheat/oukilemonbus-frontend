import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { formatDateTime } from '../../lib/dates'
import { getErrorMessage } from '../../lib/errors'
import { TOUR_ICONS, TOURS, userTours } from '../../lib/tours'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

// Section « Tutoriels » de /compte : un tutoriel par espace du compte, à revoir. « Revoir » l'oublie côté backend
// puis ouvre l'espace, où le layout le relance.
export function ToursCard() {
  const { user, hasRole, resetTour } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)
  const tours = userTours(hasRole)

  async function replay(tour) {
    setPending(tour)
    setError(null)
    try {
      await resetTour(tour)
      navigate(TOURS[tour].home)
    } catch (caught) {
      setError(getErrorMessage(caught))
      setPending(null)
    }
  }

  return (
    <Card as="section" id="tutoriels" aria-labelledby="tours-title" className="scroll-mt-6">
      <h2 id="tours-title" className="text-[17px] font-bold">
        Tutoriels
      </h2>
      <p className="mt-1 text-sm text-muted">La présentation de votre espace, montrée à votre première connexion.</p>
      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}
      <ul className="mt-4 divide-y divide-line">
        {tours.map((tour) => {
          const Icon = TOUR_ICONS[tour]
          const seenAt = user.tours_seen?.[tour]
          return (
            <li key={tour} className="flex flex-wrap items-center gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-control bg-info-soft text-info">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{TOURS[tour].label}</span>
                <span className="block text-sm text-muted">
                  {seenAt ? `Vu le ${formatDateTime(seenAt)}` : 'Pas encore vu'}
                </span>
              </span>
              <Button variant="secondary" loading={pending === tour} disabled={pending !== null} onClick={() => replay(tour)}>
                Revoir le tutoriel
              </Button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
