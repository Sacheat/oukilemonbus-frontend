import { CalendarOff, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAllDrivers } from '../../api/drivers'
import { getAllUnavailabilities } from '../../api/unavailabilities'
import { getAllVehicles } from '../../api/vehicles'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { UnavailabilityDrawerContent } from '../../components/unavailabilities/UnavailabilityDrawerContent'
import { UnavailabilityRow } from '../../components/unavailabilities/UnavailabilityRow'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import {
  countByPeriod,
  DEFAULT_PERIOD,
  NEW_UNAVAILABILITY,
  UNAVAILABILITY_PERIODS,
  unavailabilitiesForPeriod,
  unavailabilitySubject,
} from '../../lib/unavailabilities'

const EMPTY_MESSAGES = {
  'a-venir': 'Aucune indisponibilité en cours ou à venir.',
  passees: 'Aucune indisponibilité passée.',
  annulees: 'Aucune indisponibilité annulée.',
}

// Indisponibilités et listes qui servent à afficher les noms (le backend ne renvoie que les id).
// Toutes les pages sont chargées : le backend ne filtre pas, les onglets se calculent côté front.
async function fetchPageData(signal) {
  const [unavailabilityList, driverList, vehicleList] = await Promise.all([
    getAllUnavailabilities({ signal }),
    getAllDrivers({ signal }),
    getAllVehicles({ signal }),
  ])
  return { unavailabilityList, driverList, vehicleList }
}

// Flotte : indisponibilités des chauffeurs et des véhicules, en trois onglets (?periode=).
// ?indisponibilite=id ouvre le panneau de modification, ?indisponibilite=nouvelle celui de déclaration.
export function UnavailabilitiesPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const period = searchParams.get('periode') ?? DEFAULT_PERIOD
  const openedParam = searchParams.get('indisponibilite') // null, 'nouvelle' ou l'id d'une indisponibilité

  const page = useApi(fetchPageData) // défini hors du composant : même fonction à chaque rendu
  const pageData = page.data // undefined tant que rien n'est reçu
  const canCreate = can('unavailabilities.create')

  function updateSearch(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
  }

  function openDrawer(unavailabilityParam) {
    setNotice(null)
    updateSearch('indisponibilite', unavailabilityParam)
  }

  function closeDrawer() {
    updateSearch('indisponibilite', null)
  }

  // Après un succès : panneau fermé, liste rechargée, message en haut de la page
  function finishAction(message) {
    closeDrawer()
    page.reload()
    setNotice(message)
  }

  function subjectOf(unavailability) {
    return unavailabilitySubject(unavailability, pageData.driverList, pageData.vehicleList)
  }

  // La réponse de création ne dit pas quelles réservations sont passées en conflit : message général
  function handleSaved(savedUnavailability, isEditing) {
    const subject = subjectOf(savedUnavailability)
    finishAction(
      isEditing
        ? `L'indisponibilité de ${subject} a été modifiée.`
        : `Indisponibilité déclarée pour ${subject}. Les réservations affectées sur cette période sont passées en conflit.`,
    )
  }

  function handleCancelled(cancelledUnavailability) {
    finishAction(`L'indisponibilité de ${subjectOf(cancelledUnavailability)} a été annulée.`)
  }

  const addButton = canCreate && (
    <Button onClick={() => openDrawer(NEW_UNAVAILABILITY)}>
      <Plus className="size-4" aria-hidden="true" />
      Déclarer une indisponibilité
    </Button>
  )

  const counts = pageData ? countByPeriod(pageData.unavailabilityList) : null
  const visibleList = pageData ? unavailabilitiesForPeriod(pageData.unavailabilityList, period) : []

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Flotte" title="Indisponibilités" actions={addButton} />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div role="group" aria-label="Période" className="flex w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1">
        {UNAVAILABILITY_PERIODS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={period === option.value}
            onClick={() => updateSearch('periode', option.value === DEFAULT_PERIOD ? null : option.value)}
            className={cx(
              'min-h-11 rounded-md px-3 text-sm font-semibold',
              period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {counts && ` (${counts[option.value]})`}
          </button>
        ))}
      </div>

      {page.error ? (
        <ErrorState error={page.error} onRetry={page.reload} />
      ) : !pageData ? (
        <Loader />
      ) : visibleList.length === 0 ? (
        <EmptyState icon={CalendarOff} title={EMPTY_MESSAGES[period]} actions={period === DEFAULT_PERIOD && addButton} />
      ) : (
        <ul className="grid gap-3">
          {visibleList.map((unavailability) => (
            <li key={unavailability.id}>
              <UnavailabilityRow
                unavailability={unavailability}
                subject={subjectOf(unavailability)}
                onOpen={() => openDrawer(String(unavailability.id))}
              />
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={Boolean(openedParam)}
        onClose={closeDrawer}
        title={openedParam === NEW_UNAVAILABILITY ? 'Déclarer une indisponibilité' : 'Indisponibilité'}
      >
        <div className="grid gap-6 p-5">
          <UnavailabilityDrawerContent
            unavailabilityParam={openedParam}
            pageData={pageData}
            onSaved={handleSaved}
            onCancelled={handleCancelled}
          />
        </div>
      </Drawer>
    </div>
  )
}
