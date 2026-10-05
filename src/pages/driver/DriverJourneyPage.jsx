import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { HelpButton } from '../../components/driver/journey/HelpButton'
import { JourneyTripCard } from '../../components/driver/journey/JourneyTripCard'
import { OpenAlertBanner } from '../../components/driver/journey/OpenAlertBanner'
import { PositionNotice } from '../../components/driver/journey/PositionNotice'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { Switch } from '../../components/ui/Switch'
import { useDriverDay } from '../../hooks/useDriverDay'
import { useOpenDriverAlert } from '../../hooks/useOpenDriverAlert'
import { useWakeLock } from '../../hooks/useWakeLock'
import { formatDate } from '../../lib/dates'
import { currentMissionId, readJourneyDay } from '../../lib/driverJourney'
import { todayInBrussels } from '../../lib/planning'

// « Ma journée » du chauffeur (téléphone sur un support dans le bus) : un jour par page (?jour=, aujourd'hui par
// défaut), une carte par trajet avec ses étapes (Départ, Arrivée, puis le retour) et « Aide ».
// Les flèches mènent au jour précédent ou suivant qui a des missions. L'écran reste allumé (interrupteur).
// Après un appui, l'avancement du trajet est mis à jour avec la réponse du backend, sans recharger la page.
export function DriverJourneyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const day = readJourneyDay(searchParams)
  const today = todayInBrussels()
  const dayData = useDriverDay(day)
  const openAlert = useOpenDriverAlert()
  const [keepAwake, setKeepAwake] = useState(true)
  const wakeLock = useWakeLock(keepAwake)
  // Avancements reçus après un appui, par réservation (prioritaires sur ceux du chargement)
  const [recorded, setRecorded] = useState({ day: null, progress: {} })
  const [notice, setNotice] = useState(null)

  const missionList = dayData.data?.missionList
  const progressMap = { ...dayData.data?.progressMap, ...(recorded.day === day ? recorded.progress : {}) }
  const currentId = missionList ? currentMissionId(missionList, progressMap) : null

  function showDay(value) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === today) next.delete('jour')
    else next.set('jour', value)
    setSearchParams(next)
    setNotice(null)
  }

  function handleRecorded(meta, event) {
    setRecorded((previous) => ({
      day,
      progress: { ...(previous.day === day ? previous.progress : {}), [meta.progress.reservation_id]: meta.progress },
    }))
    if (meta.trip_report) setNotice('Mission terminée : le compte rendu est enregistré. Merci.')
    else if (meta.created) setNotice(`${event.type_label} enregistré à ${event.local_time} (${event.position_state_label.toLowerCase()}).`)
    else setNotice(null)
  }

  function handleAlertSent() {
    setNotice(null)
    openAlert.reload()
  }

  let content
  if (dayData.error) content = <ErrorState error={dayData.error} onRetry={dayData.reload} />
  else if (!missionList) content = <Loader />
  else if (missionList.length === 0) {
    const nextDay = dayData.data.nextDay
    content = (
      <EmptyState icon={CalendarCheck} title={day === today ? 'Pas de mission aujourd’hui' : 'Pas de mission ce jour-là'}>
        {nextDay ? (
          <Button variant="link" onClick={() => showDay(nextDay)}>
            Prochaine mission : <span className="first-letter:uppercase">{formatDate(nextDay)}</span>
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
            onRecorded={handleRecorded}
            onAlertSent={handleAlertSent}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Ma journée"
        title={<span className="first-letter:uppercase">{formatDate(day)}</span>}
        actions={<HelpButton onSent={handleAlertSent} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => showDay(dayData.data?.previousDay)}
          disabled={!dayData.data?.previousDay}
          aria-label="Jour précédent avec des missions"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <Button variant="secondary" onClick={() => showDay(today)} disabled={day === today}>
          Aujourd’hui
        </Button>
        <Button
          variant="secondary"
          onClick={() => showDay(dayData.data?.nextDay)}
          disabled={!dayData.data?.nextDay}
          aria-label="Jour suivant avec des missions"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </Button>
        {wakeLock.supported && (
          <Switch
            label="Garder l’écran allumé"
            checked={keepAwake}
            onChange={(event) => setKeepAwake(event.target.checked)}
            className="ml-auto"
          />
        )}
      </div>

      <PositionNotice />
      {openAlert.data && <OpenAlertBanner alert={openAlert.data} onUpdated={() => openAlert.reload()} />}
      {notice && (
        <Alert tone="success" className="sticky top-2 z-10">
          {notice}
        </Alert>
      )}
      {content}
    </div>
  )
}
