import { Plus, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getDriver, getDrivers } from '../../api/drivers'
import { useAuth } from '../../auth/useAuth'
import { DriverCard } from '../../components/drivers/DriverCard'
import { DriverDrawerContent } from '../../components/drivers/DriverDrawerContent'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { useApi } from '../../hooks/useApi'
import { useFleetToday } from '../../hooks/useFleetToday'
import { useNow } from '../../hooks/useNow'
import { useOpenedItem } from '../../hooks/useOpenedItem'
import { NEW_DRIVER, sortActiveFirst } from '../../lib/drivers'
import { fleetDayState, fleetPlanningLink } from '../../lib/fleetToday'

// Flotte : chauffeurs en cartes (actifs d'abord), paginés par 15.
// ?chauffeur=id ouvre le panneau de modification, ?chauffeur=nouveau celui d'ajout ; ?page=n la page de la liste.
export function DriversPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const page = Number(searchParams.get('page') ?? 1)
  const openedDriverParam = searchParams.get('chauffeur') // null, 'nouveau' ou l'id d'un chauffeur

  const fetchDrivers = useCallback((signal) => getDrivers({ page }, { signal }), [page])
  const drivers = useApi(fetchDrivers)
  // État du jour de chaque carte (trajets, indisponibilités en cours, avancement réel)
  const today = useFleetToday()
  const nowTime = useNow().slice(11)
  const driverList = drivers.data?.data // undefined tant que rien n'est reçu
  const canCreate = can('drivers.create')

  const isCreating = openedDriverParam === NEW_DRIVER
  // Pris dans la page affichée, sinon relu par GET /drivers/{id} (lien « permis » du tableau de bord…)
  const opened = useOpenedItem(driverList, openedDriverParam, getDriver)
  const openedDriver = opened.item

  function updateSearch(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
  }

  function openDrawer(driverParam) {
    setNotice(null)
    updateSearch('chauffeur', driverParam)
  }

  function closeDrawer() {
    updateSearch('chauffeur', null)
  }

  function changePage(nextPage) {
    updateSearch('page', nextPage > 1 ? String(nextPage) : null)
  }

  // Après un succès : panneau fermé, liste rechargée, message en haut de la page
  function finishAction(message) {
    closeDrawer()
    drivers.reload()
    setNotice(message)
  }

  // Le chauffeur renvoyé par le POST peut arriver sans `user` : on reste générique dans ce cas
  function driverName(driver) {
    return driver.user?.full_name ?? 'Le chauffeur'
  }

  function handleSaved(savedDriver, isEditing) {
    finishAction(isEditing ? `Le permis de ${driverName(savedDriver)} a été modifié.` : `${driverName(savedDriver)} est maintenant chauffeur.`)
  }

  function handleStatusChanged(updatedDriver) {
    finishAction(
      updatedDriver.is_active ? `${driverName(updatedDriver)} est réactivé.` : `${driverName(updatedDriver)} est désactivé.`,
    )
  }

  const addButton = canCreate && (
    <Button onClick={() => openDrawer(NEW_DRIVER)}>
      <Plus className="size-4" aria-hidden="true" />
      Ajouter un chauffeur
    </Button>
  )

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Flotte" title="Chauffeurs" actions={addButton} />

      {notice && <Alert tone="success">{notice}</Alert>}

      {drivers.error ? (
        <ErrorState error={drivers.error} onRetry={drivers.reload} />
      ) : !driverList ? (
        <Loader />
      ) : driverList.length === 0 ? (
        <EmptyState icon={Users} title="Aucun chauffeur enregistré" actions={addButton}>
          Créez le profil chauffeur d'un compte existant pour pouvoir l'affecter aux déplacements.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {sortActiveFirst(driverList).map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onOpen={() => openDrawer(String(driver.id))}
                dayState={fleetDayState('driver', driver.id, today, nowTime)}
                planningHref={today && fleetPlanningLink('driver', driver.id, today.day)}
              />
            ))}
          </div>
          <Pagination meta={drivers.data.meta} onPageChange={changePage} />
        </>
      )}

      <Drawer
        open={Boolean(openedDriverParam)}
        onClose={closeDrawer}
        title={isCreating ? 'Ajouter un chauffeur' : (openedDriver?.user?.full_name ?? 'Chauffeur')}
      >
        <div className="grid gap-6 p-5">
          <DriverDrawerContent
            driverParam={openedDriverParam}
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
