import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx'

function point(location) {
  const lat = Number(location?.latitude)
  const lng = Number(location?.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? [lat, lng] : null
}

function marker(L, className) {
  return L.divIcon({ className: '', html: `<span class="${className}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] })
}

// Carte d'une demande d'aide (OpenStreetMap, Leaflet chargé à la demande) : le point du bus avec son cercle de
// précision (position du téléphone), ou le dernier lieu connu ; le lieu de départ et la destination du trajet en
// repère. Rien sans point à montrer.
export function AlertMap({ alert, height = 'h-80', className }) {
  const container = useRef(null)
  const [failed, setFailed] = useState(false)
  const bus = point(alert.map_point)
  const exact = alert.map_point?.exact ?? false
  const accuracy = exact ? alert.position.accuracy_m : null
  const pickup = point(alert.reservation?.pickup)
  const destination = point(alert.reservation?.destination)
  const key = bus ? JSON.stringify([bus, accuracy, pickup, destination]) : null

  useEffect(() => {
    if (!key) return undefined
    let map = null
    let cancelled = false
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([module]) => {
        if (cancelled || !container.current) return
        const L = module.default ?? module
        const [busPoint, radius, from, to] = JSON.parse(key)
        const styles = getComputedStyle(document.documentElement)
        const danger = styles.getPropertyValue('--danger').trim()
        map = L.map(container.current, { scrollWheelZoom: false })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        if (radius) L.circle(busPoint, { radius, color: danger, weight: 1, fillOpacity: 0.12 }).addTo(map)
        L.circleMarker(busPoint, { radius: 9, color: danger, weight: 3, fillColor: danger, fillOpacity: 0.85 }).addTo(map)
        if (from) L.marker(from, { icon: marker(L, 'trip-map-pin trip-map-pin--from'), keyboard: false }).addTo(map)
        if (to) L.marker(to, { icon: marker(L, 'trip-map-pin trip-map-pin--to'), keyboard: false }).addTo(map)
        map.setView(busPoint, 16)
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [key])

  if (!key || failed) return null

  return (
    <figure className={cx('m-0 overflow-hidden rounded-card border border-line', className)}>
      <div
        ref={container}
        role="img"
        aria-label={exact ? 'Carte : position envoyée par le téléphone' : 'Carte : dernier lieu connu du trajet'}
        className={cx('trip-map isolate w-full bg-surface-muted', height)}
      />
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-3 rounded-full bg-danger" />
          {exact ? 'Position du bus' : 'Dernier lieu connu (position non envoyée)'}
        </span>
        {pickup && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="trip-map-pin trip-map-pin--from" /> Lieu de départ
          </span>
        )}
        {destination && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="trip-map-pin trip-map-pin--to" /> Destination
          </span>
        )}
      </figcaption>
    </figure>
  )
}
