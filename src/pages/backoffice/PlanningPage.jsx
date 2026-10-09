import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAllDrivers } from '../../api/drivers'
import { getAllVehicles } from '../../api/vehicles'
import { useAuth } from '../../auth/useAuth'
import { PlanningExportButton } from '../../components/planning/PlanningExportButton'
import { PlanningResults } from '../../components/planning/PlanningResults'
import { PlanningTripDetails } from '../../components/planning/PlanningTripDetails'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { Checkbox, Field, Input, Select } from '../../components/ui/Field'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { usePlanning } from '../../hooks/usePlanning'
import { useTripProgress } from '../../hooks/useTripProgress'
import { useTripReports } from '../../hooks/useTripReports'
import { cx } from '../../lib/cx'
import { formatDate } from '../../lib/dates'
import {
  addDays,
  DEFAULT_VIEW,
  mondayOf,
  periodProblem,
  PLANNING_VIEWS,
  planningApiParams,
  planningRequestKey,
  readPlanningSearch,
  requestedPeriod,
  shownWeekDay,
  todayInBrussels,
  tripsByDay,
} from '../../lib/planning'

// Chauffeurs et véhicules des listes de filtres (chargés une fois)
async function fetchFleet(signal) {
  const [driverList, vehicleList] = await Promise.all([getAllDrivers({ signal }), getAllVehicles({ signal })])
  return { driverList, vehicleList }
}

// Planning (lecture seule) : trajets d'une semaine (lundi → vendredi, par défaut) ou d'une période en liste
// (31 jours au plus), filtrés par statut, véhicule et chauffeur ; détail d'un trajet dans un panneau ; export Excel.
// Tout l'état est dans l'URL : ?vue=liste, ?semaine=, ?jour= (petit écran : jour affiché de la semaine), ?du=&au=,
// ?statuts=tous, ?vehicule=, ?chauffeur=, ?trajet=
export function PlanningPage() {
  const { can } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [notice, setNotice] = useState(null)
  const planningSearch = readPlanningSearch(searchParams)
  const today = todayInBrussels()
  const period = requestedPeriod(planningSearch)
  const problem = periodProblem(period)

  // Période et filtres sous forme de texte : rechargement seulement s'ils changent (pas en ouvrant un trajet)
  const requestKey = planningRequestKey(planningSearch)
  const planning = usePlanning(requestKey)
  const fleet = useApi(fetchFleet)

  const tripList = planning.data?.data
  // Comptes rendus des trajets affichés (badges Réalisé, Non réalisé, Compte rendu attendu, Sans compte rendu)
  const tripIds = (tripList ?? []).map((trip) => trip.reservation_id).join(',')
  const reports = useTripReports(tripIds)
  // Avancement des trajets (boutons Départ / Arrivée des chauffeurs), relu toutes les 60 s
  const progress = useTripProgress(tripIds)
  const groupedTrips = tripList ? tripsByDay(tripList) : {}
  const openedTrip = tripList?.find((trip) => String(trip.reservation_id) === planningSearch.openedTripId)

  // Change un ou plusieurs paramètres d'URL (null ou '' : retiré)
  function updateSearch(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => {
      if (value) next.set(name, value)
      else next.delete(name)
    })
    setSearchParams(next)
  }

  // Compte rendu saisi ou corrigé par l'agent : panneau fermé, badges rechargés, message en haut de la page
  function handleReportSaved(savedReport) {
    setNotice(`Compte rendu du trajet n° ${savedReport.reservation_id} enregistré.`)
    updateSearch({ trajet: null })
    reports.reload()
  }

  // Étape annulée : le panneau reste ouvert, l'avancement est relu (badges et étapes à jour)
  function handleStepCancelled(cancelledEvent) {
    setNotice(`« ${cancelledEvent.type_label} » annulé : le chauffeur peut appuyer à nouveau.`)
    progress.reload()
  }

  function showWeek(monday) {
    updateSearch({ semaine: monday === mondayOf(today) ? null : monday, jour: null })
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion"
        title="Planning"
        actions={<PlanningExportButton exportParams={planningApiParams(requestKey)} disabled={Boolean(problem)} />}
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Affichage" className="flex rounded-control border border-line-strong bg-surface p-1">
          {PLANNING_VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={planningSearch.view === option.value}
              onClick={() => updateSearch({ vue: option.value === DEFAULT_VIEW ? null : option.value })}
              className={cx(
                'min-h-11 rounded-md px-3 text-sm font-semibold',
                planningSearch.view === option.value ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {planningSearch.view === 'semaine' ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => showWeek(addDays(planningSearch.weekStart, -7))}
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" onClick={() => showWeek(mondayOf(today))}>
              Aujourd'hui
            </Button>
            <Button
              variant="secondary"
              onClick={() => showWeek(addDays(planningSearch.weekStart, 7))}
              aria-label="Semaine suivante"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">
              Semaine du {formatDate(period.start, { day: 'numeric', month: 'long' })} au{' '}
              {formatDate(period.end, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Du">
              {(props) => (
                <Input {...props} type="date" value={planningSearch.from} onChange={(event) => updateSearch({ du: event.target.value })} />
              )}
            </Field>
            <Field label="Au">
              {(props) => (
                <Input {...props} type="date" value={planningSearch.to} onChange={(event) => updateSearch({ au: event.target.value })} />
              )}
            </Field>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Véhicule">
          {(props) => (
            <Select {...props} value={planningSearch.vehicleId} onChange={(event) => updateSearch({ vehicule: event.target.value })}>
              <option value="">Tous les véhicules</option>
              {(fleet.data?.vehicleList ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licence_plate}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Chauffeur">
          {(props) => (
            <Select {...props} value={planningSearch.driverId} onChange={(event) => updateSearch({ chauffeur: event.target.value })}>
              <option value="">Tous les chauffeurs</option>
              {(fleet.data?.driverList ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.user?.full_name ?? `Chauffeur n° ${driver.id}`}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Checkbox
          label="Afficher aussi les trajets refusés et annulés"
          checked={planningSearch.showAllStatuses}
          onChange={(event) => updateSearch({ statuts: event.target.checked ? 'tous' : null })}
        />
      </div>

      <PlanningResults
        problem={problem}
        planning={planning}
        view={planningSearch.view}
        weekStart={planningSearch.weekStart}
        tripsGroupedByDay={groupedTrips}
        today={today}
        shownDay={shownWeekDay(planningSearch, today)}
        onShowDay={(day) => updateSearch({ jour: day === today ? null : day })}
        onOpenTrip={(trip) => updateSearch({ trajet: String(trip.reservation_id) })}
        reports={reports.data}
        progress={progress.data}
      />

      <Drawer
        open={Boolean(planningSearch.openedTripId)}
        onClose={() => updateSearch({ trajet: null })}
        title={openedTrip?.organization?.name ?? 'Trajet'}
      >
        <div className="p-5">
          {openedTrip ? (
            <PlanningTripDetails
              key={openedTrip.reservation_id}
              trip={openedTrip}
              report={reports.data?.[openedTrip.reservation_id] ?? null}
              progress={progress.data?.[openedTrip.reservation_id] ?? null}
              canManageReports={can('trip-reports.manage')}
              // Pas avant de savoir si le compte rendu existe (le backend refuserait l'annulation)
              canCancelSteps={can('trip-progress.manage') && reports.data !== undefined}
              onReportSaved={handleReportSaved}
              onStepCancelled={handleStepCancelled}
            />
          ) : tripList ? (
            <Alert tone="warning">Ce trajet ne fait pas partie de la période ou des filtres affichés.</Alert>
          ) : (
            <Loader />
          )}
        </div>
      </Drawer>
    </div>
  )
}
