import { CalendarOff, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getActiveDrivers } from '../../api/drivers'
import { getUnavailabilityPage } from '../../api/unavailabilities'
import { getActiveVehicles } from '../../api/vehicles'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Field, Select } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { UnavailabilityDrawerContent } from '../../components/unavailabilities/UnavailabilityDrawerContent'
import { UnavailabilityRow } from '../../components/unavailabilities/UnavailabilityRow'
import { useApi } from '../../hooks/useApi'
import { cx } from '../../lib/cx'
import {
  DEFAULT_PERIOD,
  driverOptions,
  NEW_UNAVAILABILITY,
  periodCounts,
  readUnavailabilitySearch,
  UNAVAILABILITY_PERIODS,
  unavailabilityListParams,
  unavailabilitySubject,
  vehicleOptions,
} from '../../lib/unavailabilities'

const EMPTY_MESSAGES = {
  'a-venir': 'Aucune indisponibilité en cours ou à venir.',
  passees: 'Aucune indisponibilité passée.',
  annulees: 'Aucune indisponibilité annulée.',
}

// Chauffeurs et véhicules actifs : listes de choix du filtre et du formulaire (la flotte d'une commune reste petite)
async function fetchFleet(signal) {
  const [drivers, vehicles] = await Promise.all([getActiveDrivers({ signal }), getActiveVehicles({ signal })])
  return { driverList: drivers.items, vehicleList: vehicles.items, complete: drivers.complete && vehicles.complete }
}

// Flotte : indisponibilités des chauffeurs et des véhicules, en trois onglets.
// Le backend filtre, trie et découpe en pages (elles s'accumulent avec les années) : un seul appel par onglet et page.
// URL : ?periode=a-venir|passees|annulees, ?chauffeur=id, ?vehicule=id, ?page=n ;
// ?indisponibilite=id ouvre le panneau de modification, ?indisponibilite=nouvelle celui de déclaration.
export function UnavailabilitiesPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const search = readUnavailabilitySearch(searchParams)
  const openedParam = searchParams.get('indisponibilite') // null, 'nouvelle' ou l'id d'une indisponibilité

  // Clé texte : le chargement repart seulement quand l'onglet, un filtre ou la page change
  const listKey = JSON.stringify(unavailabilityListParams(search))
  const fetchList = useCallback((signal) => getUnavailabilityPage(JSON.parse(listKey), { signal }), [listKey])
  const list = useApi(fetchList)
  const fleet = useApi(fetchFleet) // défini hors du composant : même fonction à chaque rendu
  const canCreate = can('unavailabilities.create')

  // Plusieurs paramètres à la fois ; changer d'onglet ou de filtre ramène à la page 1
  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next)
  }

  function openDrawer(unavailabilityParam) {
    setNotice(null)
    updateSearch({ indisponibilite: unavailabilityParam })
  }

  function closeDrawer() {
    updateSearch({ indisponibilite: null })
  }

  // Après un succès : panneau fermé, liste rechargée, message en haut de la page
  function finishAction(message) {
    closeDrawer()
    list.reload()
    setNotice(message)
  }

  // La réponse de création ne dit pas quelles réservations sont passées en conflit : message général
  function handleSaved(savedUnavailability, isEditing) {
    const subject = unavailabilitySubject(savedUnavailability)
    finishAction(
      isEditing
        ? `L'indisponibilité de ${subject} a été modifiée.`
        : `Indisponibilité déclarée pour ${subject}. Les réservations affectées sur cette période sont passées en conflit.`,
    )
  }

  function handleCancelled(cancelledUnavailability) {
    finishAction(`L'indisponibilité de ${unavailabilitySubject(cancelledUnavailability)} a été annulée.`)
  }

  const addButton = canCreate && (
    <Button onClick={() => openDrawer(NEW_UNAVAILABILITY)}>
      <Plus className="size-4" aria-hidden="true" />
      Déclarer une indisponibilité
    </Button>
  )

  const counts = periodCounts(list.data?.meta)
  const visibleList = list.data?.data ?? []
  const filtered = Boolean(search.driverId || search.vehicleId)

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Flotte" title="Indisponibilités" actions={addButton} />

      {notice && <Alert tone="success">{notice}</Alert>}
      {fleet.data && !fleet.data.complete && (
        <Alert tone="warning">
          La flotte compte plus de 150 chauffeurs ou véhicules actifs : les listes de choix ne montrent que les 150
          premiers. Prévenez l’administrateur pour adapter la page.
        </Alert>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label="Période" className="flex w-fit flex-wrap rounded-control border border-line-strong bg-surface p-1">
          {UNAVAILABILITY_PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={search.period === option.value}
              onClick={() => updateSearch({ periode: option.value === DEFAULT_PERIOD ? null : option.value, page: null })}
              className={cx(
                'min-h-11 rounded-md px-3 text-sm font-semibold',
                search.period === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
              {counts && ` (${counts[option.value]})`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Field label="Chauffeur" className="w-56 max-w-full">
            {(props) => (
              <Select
                {...props}
                value={search.driverId}
                onChange={(event) => updateSearch({ chauffeur: event.target.value, page: null })}
              >
                <option value="">Tous les chauffeurs</option>
                {driverOptions(fleet.data?.driverList ?? [], Number(search.driverId) || null).map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.user?.full_name ?? `Chauffeur n° ${driver.id}`}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Véhicule" className="w-48 max-w-full">
            {(props) => (
              <Select
                {...props}
                value={search.vehicleId}
                onChange={(event) => updateSearch({ vehicule: event.target.value, page: null })}
              >
                <option value="">Tous les véhicules</option>
                {vehicleOptions(fleet.data?.vehicleList ?? [], Number(search.vehicleId) || null).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licence_plate}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <Loader />
      ) : visibleList.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={filtered ? 'Aucune indisponibilité pour ce filtre.' : EMPTY_MESSAGES[search.period]}
          actions={!filtered && search.period === DEFAULT_PERIOD && addButton}
        />
      ) : (
        <>
          <ul className="grid gap-3">
            {visibleList.map((unavailability) => (
              <li key={unavailability.id}>
                <UnavailabilityRow
                  unavailability={unavailability}
                  subject={unavailabilitySubject(unavailability)}
                  onOpen={() => openDrawer(String(unavailability.id))}
                />
              </li>
            ))}
          </ul>
          <Pagination meta={list.data.meta} onPageChange={(value) => updateSearch({ page: value > 1 ? String(value) : null })} />
        </>
      )}

      <Drawer
        open={Boolean(openedParam)}
        onClose={closeDrawer}
        title={openedParam === NEW_UNAVAILABILITY ? 'Déclarer une indisponibilité' : 'Indisponibilité'}
      >
        <div className="grid gap-6 p-5">
          {openedParam && (
            <UnavailabilityDrawerContent
              key={openedParam}
              unavailabilityParam={openedParam}
              fleet={fleet.data}
              onSaved={handleSaved}
              onCancelled={handleCancelled}
            />
          )}
        </div>
      </Drawer>
    </div>
  )
}
