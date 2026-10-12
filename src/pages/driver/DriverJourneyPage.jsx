import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { HelpButton } from '../../components/driver/journey/HelpButton'
import { JourneyTripCard } from '../../components/driver/journey/JourneyTripCard'
import { OpenAlertBanner } from '../../components/driver/journey/OpenAlertBanner'
import { PositionNotice } from '../../components/driver/journey/PositionNotice'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Switch } from '../../components/ui/Switch'
import { Toast } from '../../components/ui/Toast'
import { useDriverDay } from '../../hooks/useDriverDay'
import { useOpenDriverAlert } from '../../hooks/useOpenDriverAlert'
import { useWakeLock } from '../../hooks/useWakeLock'
import { formatDate } from '../../lib/dates'
import { currentMissionId, readJourneyDay } from '../../lib/driverJourney'
import { todayInBrussels } from '../../lib/planning'

// « Ma journée » du chauffeur (téléphone sur un support dans le bus) : un jour par page (?jour=, aujourd'hui par
// défaut), une carte par trajet avec ses étapes (Départ, Arrivée, puis le retour). Tout vient d'un appel
// (useDriverDay), relu toutes les 60 s : un trajet annulé ou modifié par un agent apparaît sans recharger.
// Les flèches mènent au jour précédent ou suivant qui a des missions (« Aujourd'hui » seulement un autre jour) ; l'écran
// reste allumé (interrupteur).
// Un seul bouton « Aide », collé en bas de l'écran, rattaché au trajet en cours (aujourd'hui).
// Après un appui, l'avancement du trajet est mis à jour avec la réponse du backend, puis un message temporaire.
export function DriverJourneyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const day = readJourneyDay(searchParams)
  const today = todayInBrussels()
  const dayData = useDriverDay(day)
  const openAlert = useOpenDriverAlert()
  const [keepAwake, setKeepAwake] = useState(true)
  const wakeLock = useWakeLock(keepAwake)
  // Avancements reçus après un appui, pour la journée chargée (le chargement suivant les contient déjà)
  const [recorded, setRecorded] = useState({ data: null, progress: {} })
  const [toast, setToast] = useState(null)

  const data = dayData.data
  const missionList = data?.missionList
  const progressMap = { ...data?.progressMap, ...(recorded.data === data ? recorded.progress : {}) }
  const currentId = missionList ? currentMissionId(missionList, progressMap) : null
  const currentMission = day === today ? (missionList?.find((mission) => mission.id === currentId) ?? null) : null
  const engine = data?.settings?.navigation_engine

  function showDay(value) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === today) next.delete('jour')
    else next.set('jour', value)
    setSearchParams(next)
    setToast(null)
  }

  function notify(message) {
    setToast((previous) => ({ message, key: (previous?.key ?? 0) + 1 }))
  }

  function keepProgress(meta) {
    setRecorded((previous) => ({
      data,
      progress: { ...(previous.data === data ? previous.progress : {}), [meta.progress.reservation_id]: meta.progress },
    }))
  }

  function handleRecorded(meta, event) {
    keepProgress(meta)
    if (meta.trip_report) notify('Mission terminée : le compte rendu est enregistré. Merci.')
    else if (meta.created) notify(`${event.type_label} enregistré à ${event.local_time} (${event.position_state_label.toLowerCase()}).`)
  }

  // Appui annulé par le chauffeur (dans les 2 min) : l'avancement revient à l'étape précédente
  function handleUndone(meta, event) {
    keepProgress(meta)
    notify(`${event.type_label} annulé : appuyez à nouveau au bon moment.`)
  }

  function handleAlertSent() {
    setToast(null)
    openAlert.reload()
  }

  let content
  if (dayData.error && !data) content = <ErrorState error={dayData.error} onRetry={dayData.reload} />
  else if (!missionList) content = <Loader />
  else if (missionList.length === 0) {
    content = (
      <EmptyState icon={CalendarCheck} title={day === today ? 'Pas de mission aujourd’hui' : 'Pas de mission ce jour-là'}>
        {data.nextDay ? (
          <Button variant="link" onClick={() => showDay(data.nextDay)}>
            Prochaine mission : <span className="first-letter:uppercase">{formatDate(data.nextDay)}</span>
          </Button>
        ) : (
          'Aucune mission prévue pour la suite.'
        )}
      </EmptyState>
    )
  } else {
    content = (
      <div className="grid gap-4">
        {missionList.map((mission) => (
          <JourneyTripCard
            key={mission.id}
            mission={mission}
            progress={progressMap[mission.id]}
            current={day === today && mission.id === currentId}
            engine={engine}
            onRecorded={handleRecorded}
            onUndone={handleUndone}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Ma journée" title={<span className="first-letter:uppercase">{formatDate(day)}</span>} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => showDay(data?.previousDay)}
          disabled={!data?.previousDay}
          aria-label="Jour précédent avec des missions"
          className="px-3"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        {day !== today && (
          <Button variant="secondary" onClick={() => showDay(today)}>
            Aujourd’hui
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => showDay(data?.nextDay)}
          disabled={!data?.nextDay}
          aria-label="Jour suivant avec des missions"
          className="px-3"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </Button>
        {wakeLock.supported && (
          <Switch label="Écran allumé" checked={keepAwake} onChange={(event) => setKeepAwake(event.target.checked)} className="ml-auto" />
        )}
      </div>

      <PositionNotice />
      {openAlert.data && <OpenAlertBanner alert={openAlert.data} onUpdated={() => openAlert.reload()} />}
      {content}

      {/* Toujours à portée de main, en bas de l'écran ; rattaché au trajet en cours s'il y en a un */}
      <div className="sticky bottom-3 z-20 grid">
        <HelpButton
          mission={currentMission}
          onSent={handleAlertSent}
          className="min-h-14 w-full text-lg shadow-lift"
        />
      </div>

      {toast && <Toast key={toast.key} message={toast.message} top onClose={() => setToast(null)} />}
    </div>
  )
}
