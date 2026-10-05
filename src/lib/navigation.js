// Liens vers l'application de navigation choisie par la commune (GET /driver-journey/settings, catalogue dans
// config/driver_journey.php du backend). Gabarits : {lat}, {lng} = destination, {label} = nom du lieu,
// {from_lat}, {from_lng} = point de départ connu.
//
//   téléphone Android et gabarit `android` → geo: (ouvre l'application installée : Organic Maps, OsmAnd, Google Maps…,
//                                            utilisable hors ligne si la région est téléchargée)
//   sinon, avec un point de départ connu    → `web_from`
//   sinon                                   → `web` (itinéraire depuis la position du téléphone)
//   lieu sans coordonnées                    → recherche de l'adresse

// Moteur utilisé tant que les réglages ne sont pas chargés (ou s'ils ne le sont pas) : même défaut que le backend
export const DEFAULT_NAVIGATION_ENGINE = {
  key: 'openstreetmap',
  label: 'OpenStreetMap',
  android: 'geo:{lat},{lng}?q={lat},{lng}({label})',
  web: 'https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=17/{lat}/{lng}',
  web_from: 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route={from_lat}%2C{from_lng}%3B{lat}%2C{lng}',
}

export function isAndroid() {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
}

function coordinates(location) {
  const lat = Number(location?.latitude)
  const lng = Number(location?.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { lat, lng } : null
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in values ? values[name] : match))
}

// Lieu sans coordonnées : recherche de l'adresse (rare : les lieux enregistrés sont géolocalisés)
function addressUrl(engine, address, android) {
  const query = encodeURIComponent(address)
  if (android) return `geo:0,0?q=${query}`
  if (engine.key === 'google') return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`
  return `https://www.openstreetmap.org/search?query=${query}`
}

// { href, external } : `external` = lien geo: (application du téléphone), à ouvrir sans onglet nommé
export function navigationLink(engine, destination, origin = null) {
  const active = engine ?? DEFAULT_NAVIGATION_ENGINE
  const android = isAndroid() && Boolean(active.android)
  const to = coordinates(destination)

  if (!to) {
    const address = destination?.formatted_address ?? ''
    return address ? { href: addressUrl(active, address, android), external: android } : null
  }

  const values = { lat: to.lat, lng: to.lng, label: encodeURIComponent(destination?.name ?? destination?.formatted_address ?? 'Destination') }
  // geo: n'a pas de point de départ : l'application part de la position du téléphone
  if (android) return { href: fill(active.android, values), external: true }

  const from = coordinates(origin)
  if (from && active.web_from) return { href: fill(active.web_from, { ...values, from_lat: from.lat, from_lng: from.lng }), external: false }
  return { href: fill(active.web, values), external: false }
}

// Distance d'un itinéraire : « 350 m », « 12,4 km »
export function routeDistanceText(meters) {
  const value = Number(meters) || 0
  if (value < 1000) return `${Math.round(value / 10) * 10} m`
  return `${(value / 1000).toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km`
}

// Durée d'un itinéraire : « 8 min », « 1 h 05 »
export function routeDurationText(seconds) {
  const minutes = Math.max(1, Math.round((Number(seconds) || 0) / 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
