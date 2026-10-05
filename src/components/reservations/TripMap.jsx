import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx'
import { shortAddress } from '../../lib/reservations'

function point(location) {
  const lat = Number(location?.latitude)
  const lng = Number(location?.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? [lat, lng] : null
}

// Pastilles des deux lieux (pas d'image : icônes en HTML stylées par les classes du projet)
function marker(L, className) {
  return L.divIcon({ className: '', html: `<span class="${className}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] })
}

// Carte OpenStreetMap du trajet : départ et destination reliés par la route réelle si on la reçoit (`route` :
// GET /reservations/{id}/route, [[lat, lng], …]), sinon par une ligne à vol d'oiseau en pointillés.
// Leaflet est chargé seulement ici (import dynamique) ; rien n'est affiché sans coordonnées.
// `height` : hauteur de la carte ; `className` : cadre autour de la carte et de sa légende.
export function TripMap({ pickup, destination, route = null, height = 'h-64', className }) {
  const container = useRef(null)
  const [failed, setFailed] = useState(false)
  const from = point(pickup)
  const to = point(destination)
  const geometry = route?.geometry?.length > 1 ? route.geometry : null
  const key = from && to ? `${from}|${to}` : null

  useEffect(() => {
    if (!key) return undefined
    let map = null
    let cancelled = false
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([module]) => {
        if (cancelled || !container.current) return
        const L = module.default ?? module
        const [a, b] = key.split('|').map((value) => value.split(',').map(Number))
        map = L.map(container.current, { scrollWheelZoom: false, attributionControl: true })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        // Couleur du token --primary (suit le thème)
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
        const road = geometry
        if (road) L.polyline(road, { color: primary, weight: 5, opacity: 0.85 }).addTo(map)
        else L.polyline([a, b], { color: primary, weight: 3, dashArray: '6 8', opacity: 0.9 }).addTo(map)
        L.marker(a, { icon: marker(L, 'trip-map-pin trip-map-pin--from'), keyboard: false }).addTo(map)
        L.marker(b, { icon: marker(L, 'trip-map-pin trip-map-pin--to'), keyboard: false }).addTo(map)
        map.fitBounds(road ?? [a, b], { padding: [36, 36] })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      map?.remove()
    }
    // Recréée quand les lieux changent ou quand le tracé arrive (même référence tant qu'il n'est pas rechargé)
  }, [key, geometry])

  if (!key || failed) return null

  return (
    <figure className={cx('m-0', className)}>
      <div
        ref={container}
        role="img"
        aria-label={`Carte du trajet de ${shortAddress(pickup)} à ${shortAddress(destination)}`}
        className={cx('trip-map isolate w-full overflow-hidden bg-surface-muted', height)}
      />
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="trip-map-pin trip-map-pin--from" /> {shortAddress(pickup)}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="trip-map-pin trip-map-pin--to" /> {shortAddress(destination)}
        </span>
      </figcaption>
    </figure>
  )
}
