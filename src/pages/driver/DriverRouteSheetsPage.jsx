import { CalendarCheck, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { MissionDays } from '../../components/driver/MissionDays'
import { RouteSheetRow } from '../../components/driver/RouteSheetRow'
import { WeekSheetButtons } from '../../components/driver/WeekSheetButtons'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Panel } from '../../components/ui/Panel'
import { useOfficialSheets } from '../../hooks/useOfficialSheets'
import { useWeekMissions } from '../../hooks/useWeekMissions'
import { formatDate } from '../../lib/dates'
import { addDays, mondayOf, todayInBrussels } from '../../lib/planning'
import { readRouteSheetsSearch } from '../../lib/routeSheets'
import { reportsFromMissions } from '../../lib/tripReports'

// Feuilles de route du chauffeur, pour une semaine (?semaine=, par défaut la semaine en cours) :
//   1. « Ma feuille de la semaine » : ses missions confirmées et le PDF à imprimer (cases à remplir à la main,
//      support papier si le téléphone ne fonctionne pas) ;
//   2. « Feuilles officielles du véhicule » : les feuilles journalières par véhicule (carnet de bord), paginées (?page=).
export function DriverRouteSheetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { weekStart, page } = readRouteSheetsSearch(searchParams)
  const currentMonday = mondayOf(todayInBrussels())
  const missions = useWeekMissions(weekStart)
  // Comptes rendus joints aux missions de la semaine (badges Réalisé, À confirmer…), comme sur « Mes missions »
  const reports = reportsFromMissions(missions.data)
  const sheets = useOfficialSheets(weekStart, page)
  const sheetList = sheets.data?.data

  // Changer de semaine repart de la première page des feuilles officielles
  function showWeek(monday) {
    const next = new URLSearchParams(searchParams)
    if (monday === currentMonday) next.delete('semaine')
    else next.set('semaine', monday)
    next.delete('page')
    setSearchParams(next)
  }

  function showPage(value) {
    const next = new URLSearchParams(searchParams)
    if (value === 1) next.delete('page')
    else next.set('page', String(value))
    setSearchParams(next)
  }

  let missionsContent
  if (missions.error) missionsContent = <ErrorState error={missions.error} onRetry={missions.reload} />
  else if (!missions.data) missionsContent = <Loader />
  else if (missions.data.length === 0) {
    missionsContent = (
      <EmptyState icon={CalendarCheck} title="Aucune mission confirmée cette semaine">
        La feuille imprimée contiendra seulement les jours, du lundi au vendredi.
      </EmptyState>
    )
  } else missionsContent = <MissionDays missions={missions.data} reports={reports} />

  let sheetsContent
  if (sheets.error) sheetsContent = <ErrorState error={sheets.error} onRetry={sheets.reload} />
  else if (!sheetList) sheetsContent = <Loader />
  else if (sheetList.length === 0) {
    sheetsContent = (
      <p className="p-5 text-sm text-muted">
        Aucune feuille officielle pour cette semaine. Elles sont générées chaque soir à 20:00 pour le lendemain.
      </p>
    )
  } else {
    sheetsContent = (
      <>
        <ul className="divide-y divide-line">
          {sheetList.map((sheet) => (
            <RouteSheetRow key={sheet.id} sheet={sheet} />
          ))}
        </ul>
        <div className="border-t border-line p-4 empty:hidden">
          <Pagination meta={sheets.data.meta} onPageChange={showPage} />
        </div>
      </>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Espace chauffeur" title="Feuilles de route" />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => showWeek(addDays(weekStart, -7))} aria-label="Semaine précédente">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button variant="secondary" onClick={() => showWeek(currentMonday)}>
          Cette semaine
        </Button>
        <Button variant="secondary" onClick={() => showWeek(addDays(weekStart, 7))} aria-label="Semaine suivante">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
        <p className="text-sm font-semibold">
          Semaine du {formatDate(weekStart, { day: 'numeric', month: 'long' })} au{' '}
          {formatDate(addDays(weekStart, 4), { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <section aria-labelledby="ma-feuille" className="grid gap-4">
        <div className="grid gap-3 rounded-card border border-line bg-surface p-5">
          <h2 id="ma-feuille" className="flex items-center gap-2 text-lg font-bold">
            <FileText className="size-5 text-link" aria-hidden="true" />
            Ma feuille de la semaine
          </h2>
          <p className="text-sm text-muted">
            Vos missions confirmées, avec des cases à remplir à la main (heures et passagers réels, compteur, remarques).
            Gardez-la avec vous : si votre téléphone ne fonctionne pas, notez tout dessus et remettez-la à un agent.
          </p>
          <WeekSheetButtons weekStart={weekStart} />
        </div>
        {missionsContent}
      </section>

      <Panel title="Feuilles officielles du véhicule">{sheetsContent}</Panel>
    </div>
  )
}
