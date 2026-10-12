import { Bus, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getVehicle, getVehicles } from '../../api/vehicles'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { VehicleCard } from '../../components/vehicles/VehicleCard'
import { VehicleDrawerContent } from '../../components/vehicles/VehicleDrawerContent'
import { useApi } from '../../hooks/useApi'
import { useFleetToday } from '../../hooks/useFleetToday'
import { useNow } from '../../hooks/useNow'
import { useOpenedItem } from '../../hooks/useOpenedItem'
import { NEW_VEHICLE, sortActiveFirst } from '../../lib/vehicles'
import { fleetDayState, fleetPlanningLink } from '../../lib/fleetToday'

// Flotte : véhicules en cartes (en service d'abord), paginés par 15.
// ?vehicule=id ouvre le panneau de modification, ?vehicule=nouveau celui d'ajout ; ?page=n la page de la liste.
export function VehiclesPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const page = Number(searchParams.get('page') ?? 1)
  const openedVehicleParam = searchParams.get('vehicule') // null, 'nouveau' ou l'id d'un véhicule

  const fetchVehicles = useCallback((signal) => getVehicles({ page }, { signal }), [page])
  const vehicles = useApi(fetchVehicles)
  // État du jour de chaque carte (trajets, indisponibilités en cours, avancement réel)
  const today = useFleetToday()
  const nowTime = useNow().slice(11)
  const vehicleList = vehicles.data?.data // undefined tant que rien n'est reçu
  const canCreate = can('vehicles.create')

  const isCreating = openedVehicleParam === NEW_VEHICLE
  // Pris dans la page affichée, sinon relu par GET /vehicles/{id}
  const opened = useOpenedItem(vehicleList, openedVehicleParam, getVehicle)
  const openedVehicle = opened.item

  function updateSearch(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
  }

  function openDrawer(vehicleParam) {
    setNotice(null)
    updateSearch('vehicule', vehicleParam)
  }

  function closeDrawer() {
    updateSearch('vehicule', null)
  }

  function changePage(nextPage) {
    updateSearch('page', nextPage > 1 ? String(nextPage) : null)
  }

  // Après un succès : panneau fermé, liste rechargée, message en haut de la page
  function finishAction(message) {
    closeDrawer()
    vehicles.reload()
    setNotice(message)
  }

  function handleSaved(savedVehicle, isEditing) {
    finishAction(isEditing ? `Le véhicule ${savedVehicle.licence_plate} a été modifié.` : `Le véhicule ${savedVehicle.licence_plate} a été ajouté.`)
  }

  function handleStatusChanged(updatedVehicle) {
    finishAction(
      updatedVehicle.is_active
        ? `Le véhicule ${updatedVehicle.licence_plate} est remis en service.`
        : `Le véhicule ${updatedVehicle.licence_plate} est retiré du service.`,
    )
  }

  const addButton = canCreate && (
    <Button onClick={() => openDrawer(NEW_VEHICLE)}>
      <Plus className="size-4" aria-hidden="true" />
      Ajouter un véhicule
    </Button>
  )

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Flotte" title="Véhicules" actions={addButton} />

      {notice && <Alert tone="success">{notice}</Alert>}

      {vehicles.error ? (
        <ErrorState error={vehicles.error} onRetry={vehicles.reload} />
      ) : !vehicleList ? (
        <Loader />
      ) : vehicleList.length === 0 ? (
        <EmptyState icon={Bus} title="Aucun véhicule enregistré" actions={addButton}>
          Ajoutez les véhicules de la commune pour pouvoir les affecter aux déplacements.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {sortActiveFirst(vehicleList).map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onOpen={() => openDrawer(String(vehicle.id))}
                dayState={fleetDayState('vehicle', vehicle.id, today, nowTime)}
                planningHref={today && fleetPlanningLink('vehicle', vehicle.id, today.day)}
              />
            ))}
          </div>
          <Pagination meta={vehicles.data.meta} onPageChange={changePage} />
        </>
      )}

      <Drawer
        open={Boolean(openedVehicleParam)}
        onClose={closeDrawer}
        title={isCreating ? 'Ajouter un véhicule' : (openedVehicle?.licence_plate ?? 'Véhicule')}
      >
        <div className="grid gap-6 p-5">
          <VehicleDrawerContent
            vehicleParam={openedVehicleParam}
            opened={opened}
            canCreate={canCreate}
            onSaved={handleSaved}
            onStatusChanged={handleStatusChanged}
          />
        </div>
      </Drawer>
    </div>
  )
}
