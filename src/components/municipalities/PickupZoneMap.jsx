import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx'

// Carte OpenStreetMap de la zone de prise en charge : point de référence (dépôt ou centre de la commune) et cercle
// du rayon maximal du lieu de départ. Leaflet est chargé à la demande (comme TripMap) ; la carte n'est recréée que
// si le point change, le cercle suit le rayon saisi. `point` : { latitude, longitude, kind, label } ; `radiusKm`.
export function PickupZoneMap({ point, radiusKm, height = 'h-72', className }) {
  const container = useRef(null)
  const layers = useRef(null) // { map, circle }
  const [failed, setFailed] = useState(false)
  const pointKey = point ? `${point.latitude},${point.longitude},${point.kind}` : null
  const radius = useRef(radiusKm) // dernier rayon saisi, lu à la création de la carte

  useEffect(() => {
    if (!pointKey) return undefined
    let cancelled = false
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([module]) => {
        if (cancelled || !container.current) return
        const L = module.default ?? module
        const [latitude, longitude, kind] = pointKey.split(',')
        const center = [Number(latitude), Number(longitude)]
        const map = L.map(container.current, { scrollWheelZoom: false })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)
        // Couleurs des tokens (suivent le thème)
        const styles = getComputedStyle(document.documentElement)
        const primary = styles.getPropertyValue('--primary').trim()
        const circle = L.circle(center, {
          radius: radius.current * 1000,
          color: primary,
          weight: 2,
          fillColor: primary,
          fillOpacity: 0.08,
          dashArray: '6 6',
        }).addTo(map)
        const pinClass = kind === 'depot' ? 'trip-map-pin trip-map-pin--to' : 'trip-map-pin trip-map-pin--from'
        L.marker(center, {
          icon: L.divIcon({ className: '', html: `<span class="${pinClass}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] }),
          keyboard: false,
        }).addTo(map)
        // Cadrage calculé depuis le centre et le rayon : getBounds() du cercle exige une carte déjà centrée
        map.fitBounds(L.latLng(center).toBounds(radius.current * 2000), { padding: [16, 16] })
        layers.current = { map, circle }
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      layers.current?.map.remove()
      layers.current = null
    }
  }, [pointKey])

  // Rayon modifié pendant la saisie : cercle et cadrage mis à jour, sans recharger la carte
  useEffect(() => {
    radius.current = radiusKm
    const current = layers.current
    if (!current || !(radiusKm > 0)) return
    current.circle.setRadius(radiusKm * 1000)
    current.map.fitBounds(current.circle.getLatLng().toBounds(radiusKm * 2000), { padding: [16, 16] })
  }, [radiusKm])

  if (!point) {
    return (
      <p className="px-5 py-6 text-sm text-muted">
        Ni dépôt géolocalisé ni centre de commune connu : la distance du lieu de départ n’est pas vérifiée. Choisissez un
        dépôt ou synchronisez les localités avec GeoNames pour obtenir le centre de la commune.
      </p>
    )
  }
  if (failed) return <p className="px-5 py-6 text-sm text-muted">La carte n’a pas pu être chargée.</p>

  return (
    <figure className={cx('m-0', className)}>
      <div
        ref={container}
        role="img"
        aria-label={`Zone de prise en charge : ${radiusKm} km autour de ${point.label}`}
        className={cx('trip-map isolate w-full overflow-hidden bg-surface-muted', height)}
      />
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={point.kind === 'depot' ? 'trip-map-pin trip-map-pin--to' : 'trip-map-pin trip-map-pin--from'} />
          {point.label}
        </span>
        <span className="inline-flex items-center gap-2 text-muted">
          <span aria-hidden="true" className="inline-block size-3.5 rounded-full border-2 border-dashed border-primary" />
          Lieux de départ acceptés : {radiusKm} km à vol d’oiseau
        </span>
      </figcaption>
    </figure>
  )
}
