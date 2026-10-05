import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx'

function point(latitude, longitude) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  return latitude != null && longitude != null && Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
}

function pin(L, html, size) {
  return L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

// Petite carte des étapes enregistrées (panneau du Planning) : lieu de départ et destination prévus, et position du
// téléphone à chaque étape (pastilles numérotées, en rouge si loin du lieu prévu). Leaflet chargé à la demande, comme
// TripMap. `pickup`, `destination` : lieux de la réservation ; `steps` : [{ number, latitude, longitude, far, label }].
export function PlanningStepsMap({ pickup, destination, steps, className }) {
  const container = useRef(null)
  const [failed, setFailed] = useState(false)
  const from = point(pickup?.latitude, pickup?.longitude)
  const to = point(destination?.latitude, destination?.longitude)
  const located = steps
    .map((step) => ({ ...step, at: point(step.latitude, step.longitude) }))
    .filter((step) => step.at)
  const key = located.length > 0 ? JSON.stringify([from, to, located.map((step) => [step.number, step.at, step.far])]) : null

  useEffect(() => {
    if (!key) return undefined
    let map = null
    let cancelled = false
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([module]) => {
        if (cancelled || !container.current) return
        const L = module.default ?? module
        const [start, end, stepPoints] = JSON.parse(key)
        map = L.map(container.current, { scrollWheelZoom: false })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        const bounds = []
        if (start) {
          L.marker(start, { icon: pin(L, '<span class="trip-map-pin trip-map-pin--from"></span>', 18), keyboard: false }).addTo(map)
          bounds.push(start)
        }
        if (end) {
          L.marker(end, { icon: pin(L, '<span class="trip-map-pin trip-map-pin--to"></span>', 18), keyboard: false }).addTo(map)
          bounds.push(end)
        }
        stepPoints.forEach(([number, at, far]) => {
          const html = `<span class="trip-map-step${far ? ' trip-map-step--far' : ''}">${number}</span>`
          L.marker(at, { icon: pin(L, html, 22), keyboard: false, zIndexOffset: 500 }).addTo(map)
          bounds.push(at)
        })
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [key])

  if (!key || failed) return null

  return (
    <div
      ref={container}
      role="img"
      aria-label={`Carte des étapes : ${located.map((step) => `${step.number}. ${step.label}${step.far ? ', loin du lieu prévu' : ''}`).join(' ; ')}`}
      className={cx('trip-map isolate h-56 w-full overflow-hidden rounded-card border border-line bg-surface-muted', className)}
    />
  )
}
