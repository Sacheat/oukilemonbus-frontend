import { ArrowLeft, ExternalLink, Phone } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getDriverAlert, takeDriverAlert } from '../../api/driverAlerts'
import { useQueueCount } from '../../backoffice/useQueueCount'
import { AlertMap } from '../../components/alerts/AlertMap'
import { CloseAlertModal } from '../../components/alerts/CloseAlertModal'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DetailList } from '../../components/ui/DetailList'
import { ErrorState } from '../../components/ui/ErrorState'
import { Loader } from '../../components/ui/Loader'
import { PageHeader } from '../../components/ui/PageHeader'
import { useApi } from '../../hooks/useApi'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useClock } from '../../hooks/useClock'
import { cx } from '../../lib/cx'
import { formatDate, formatDateTime } from '../../lib/dates'
import { ALERT_STATUS_TONES, alertPlaceText, alertWaitingText, telHref } from '../../lib/driverAlerts'
import { getErrorMessage } from '../../lib/errors'

const LINK = 'inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 font-bold hover:bg-surface-muted'

// Page d'une demande d'aide (/gestion/alertes/:id) : carte du lieu, message, trajet, chauffeur et bus, puis
// « Prendre en charge » (le chauffeur est prévenu) et « Clôturer » (note obligatoire). Relue toutes les 60 s :
// une position renvoyée par le chauffeur apparaît sans recharger.
export function AlertDetailPage() {
  const { alertId } = useParams()
  const fetchAlert = useCallback((signal) => getDriverAlert(alertId, { signal }), [alertId])
  const loaded = useApi(fetchAlert)
  useAutoRefresh(loaded.reload)
  const [override, setOverride] = useState(null) // alerte renvoyée par une action, affichée le temps de la relire
  const [taking, setTaking] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const { refreshCount } = useQueueCount()
  const now = useClock()

  const alert = override && loaded.loading ? override : loaded.data

  // Après une action : la réponse du backend tout de suite, puis l'alerte relue
  function applyAction(updated, message) {
    setOverride(updated)
    setNotice(message)
    loaded.reload()
    refreshCount()
  }

  async function handleTake() {
    setTaking(true)
    setError(null)
    try {
      applyAction(await takeDriverAlert(alertId), 'Vous prenez en charge cette demande : le chauffeur est prévenu.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setTaking(false)
    }
  }

  if (loaded.error && !alert) return <ErrorState error={loaded.error} onRetry={loaded.reload} />
  if (!alert) return <Loader />

  const reservation = alert.reservation
  const open = alert.status !== 'cloturee'
  const waiting = alertWaitingText(alert, now)

  return (
    <div className="grid gap-6">
      <Link to="/gestion/alertes" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-link">
        <ArrowLeft className="size-4" aria-hidden="true" /> Demandes d’aide
      </Link>
      <PageHeader
        eyebrow={`Demande d’aide n° ${alert.id}`}
        title={`${alert.driver.name ?? 'Chauffeur'}${alert.vehicle ? ` · ${alert.vehicle.licence_plate}` : ''}`}
        description={
          <>
            Envoyée le {formatDateTime(alert.created_at)} ·{' '}
            <span className={cx(waiting.urgent && 'text-danger', waiting.strong && 'font-bold')}>{waiting.text}</span>
          </>
        }
        actions={<Badge tone={ALERT_STATUS_TONES[alert.status]}>{alert.status_label}</Badge>}
      />

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
      {alert.message && <Alert tone="warning" title="Message du chauffeur">« {alert.message} »</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid gap-3">
          <AlertMap alert={alert} />
          <p className="text-sm text-muted">{alertPlaceText(alert)}</p>
          {alert.map_links && (
            <div className="flex flex-wrap gap-2">
              <a href={alert.map_links.openstreetmap} target="_blank" rel="noreferrer" className={LINK}>
                <ExternalLink className="size-4" aria-hidden="true" /> Ouvrir dans OpenStreetMap
              </a>
              <a href={alert.map_links.google} target="_blank" rel="noreferrer" className={LINK}>
                <ExternalLink className="size-4" aria-hidden="true" /> Ouvrir dans Google Maps
              </a>
            </div>
          )}
        </div>

        <div className="grid gap-5">
          {/* Grand écran : actions à côté de la carte ; plus petit : dans la barre collée en bas (fin de page) */}
          {open && (
            <div className="hidden flex-wrap gap-2 lg:flex">
              {alert.status === 'ouverte' && (
                <Button onClick={handleTake} loading={taking}>
                  Prendre en charge
                </Button>
              )}
              <Button variant="secondary" onClick={() => setClosing(true)}>
                Clôturer
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {alert.driver.phone && (
              <a href={telHref(alert.driver.phone)} className={cx(LINK, open && 'max-lg:hidden')}>
                <Phone className="size-4" aria-hidden="true" /> Appeler le chauffeur
              </a>
            )}
            {reservation?.organization_phone && (
              <a href={telHref(reservation.organization_phone)} className={LINK}>
                <Phone className="size-4" aria-hidden="true" /> Appeler l’organisation
              </a>
            )}
          </div>

          <DetailList
            items={[
              ['Chauffeur', alert.driver.name ? `${alert.driver.name}${alert.driver.phone ? ` · ${alert.driver.phone}` : ''}` : '—'],
              ['Véhicule', alert.vehicle ? `${alert.vehicle.licence_plate} (${alert.vehicle.capacity} places)` : 'Non indiqué'],
              reservation && ['Trajet', `n° ${reservation.id} · ${reservation.organization ?? '—'}`],
              reservation && [
                'Horaire',
                <span className="first-letter:uppercase">
                  {formatDate(reservation.trip_date)}, {reservation.departure_time} → {reservation.return_time}
                </span>,
              ],
              reservation && ['Passagers prévus', reservation.passengers],
              reservation && ['Départ', reservation.pickup?.address],
              reservation && ['Destination', reservation.destination?.address],
              alert.trip_progress_label && ['Avancement', alert.trip_progress_label],
              alert.reminded_at && ['Relance automatique', `le ${formatDateTime(alert.reminded_at)} (personne ne l’avait prise en charge)`],
              alert.handled_by && ['Prise en charge', `${alert.handled_by}, le ${formatDateTime(alert.handled_at)}`],
              alert.closed_by && ['Clôture', `${alert.closed_by}, le ${formatDateTime(alert.closed_at)}`],
              alert.closing_note && ['Ce qui a été fait', alert.closing_note],
            ]}
          />
          {!reservation && <p className="text-sm text-muted">Demande envoyée en dehors d’un trajet.</p>}
        </div>
      </div>

      {/* Sous 1 024 px (agent de garde sur son téléphone) : les actions utiles tout de suite, toujours visibles en bas
          de l'écran pendant la lecture ; la barre est le dernier élément de la page, collée au bas de la fenêtre */}
      {open && (
        <div className="sticky bottom-0 z-[1001] -mx-5 -mb-8 flex gap-2 border-t border-line bg-surface px-5 py-3 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] sm:-mx-8 sm:px-8 lg:hidden">
          {alert.driver.phone && (
            <a href={telHref(alert.driver.phone)} className={cx(LINK, 'flex-1 justify-center')}>
              <Phone className="size-4" aria-hidden="true" /> Appeler
            </a>
          )}
          {alert.status === 'ouverte' ? (
            <Button onClick={handleTake} loading={taking} className="flex-1">
              Prendre en charge
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setClosing(true)} className="flex-1">
              Clôturer
            </Button>
          )}
        </div>
      )}

      <CloseAlertModal
        open={closing}
        alert={alert}
        onClose={() => setClosing(false)}
        onClosed={(closed) => {
          setClosing(false)
          applyAction(closed, 'Demande d’aide clôturée.')
        }}
      />
    </div>
  )
}

