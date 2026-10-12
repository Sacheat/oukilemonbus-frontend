import { shortAddress } from './reservations'

// Distance appliquée par le backend quand la commune n'en fixe pas (config reservations.*_distance_km)
export const DEFAULT_DISTANCE_KM = 50
export const MIN_DISTANCE_KM = 1
export const MAX_DISTANCE_KM = 500

// Les deux limites de distance réglables sur la commune active
export const DISTANCE_FIELDS = [
  {
    field: 'max_pickup_distance_km',
    label: 'Distance maximale du lieu de départ',
    hint: 'À vol d’oiseau, depuis le dépôt du bus (ou le centre de la commune sans dépôt).',
  },
  {
    field: 'max_trip_distance_km',
    label: 'Distance maximale du trajet',
    hint: 'Du lieu de départ à la destination.',
  },
]

// Commune active de la liste (le backend la renvoie en premier), ou null
export function activeMunicipalityOf(list) {
  return list?.find((municipality) => municipality.is_active) ?? null
}

// Valeurs du formulaire de réglages. Chaque distance a un mode (`<champ>_mode` : 'defaut' ou 'perso') et une valeur
// texte : vider le champ en mode personnalisé ne repasse pas à la valeur par défaut.
export function settingsFormValues(municipality) {
  const values = {
    name: municipality.name ?? '',
    postal_code: municipality.postal_code ?? '',
    nis_code: municipality.nis_code ?? '',
  }
  for (const { field } of DISTANCE_FIELDS) {
    const stored = municipality[field]
    values[`${field}_mode`] = stored == null ? 'defaut' : 'perso'
    values[field] = String(stored ?? municipality[`effective_${field}`] ?? DEFAULT_DISTANCE_KM)
  }
  return values
}

// Valeur envoyée pour une distance : null par défaut, sinon le nombre saisi (vide → 0, que le backend refuse avec
// son message « au moins 1 »)
function distancePayload(values, field) {
  return values[`${field}_mode`] === 'defaut' ? null : Number(values[field])
}

// Corps du PATCH : seulement ce qui a changé (dépôt compris)
export function settingsChanges(municipality, values, depot) {
  const before = settingsFormValues(municipality)
  const changes = {}
  for (const field of ['name', 'postal_code', 'nis_code']) {
    if (values[field].trim() !== before[field].trim()) changes[field] = values[field].trim() || null
  }
  for (const { field } of DISTANCE_FIELDS) {
    const next = distancePayload(values, field)
    if (next !== (municipality[field] ?? null)) changes[field] = next
  }
  const depotId = depot?.id ?? null
  if (depotId !== (municipality.depot_location_id ?? null)) changes.depot_location_id = depotId
  return changes
}

// Distance en km d'après la saisie, pour la carte (valeur par défaut si le mode l'est ou si la saisie est vide)
export function distanceInKm(values, field) {
  const number = Number(values[field])
  return values[`${field}_mode`] === 'perso' && number > 0 ? number : DEFAULT_DISTANCE_KM
}

function coordinates(item) {
  const latitude = Number(item?.latitude)
  const longitude = Number(item?.longitude)
  return item?.latitude != null && Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null
}

// Point d'où se mesure la distance du lieu de départ, comme le backend : le dépôt s'il est géolocalisé,
// sinon le centre de la commune ; null si aucun des deux (la règle n'est alors pas appliquée)
export function referencePoint(municipality, depot) {
  const depotPoint = coordinates(depot)
  if (depotPoint) return { ...depotPoint, kind: 'depot', label: `Dépôt : ${shortAddress(depot)}` }
  const center = coordinates(municipality)
  if (center) return { ...center, kind: 'center', label: `Centre de ${municipality.name}` }
  return null
}

// Texte sans accents ni majuscules, pour filtrer et comparer les noms de localités
export function normalizeName(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

// Filtre par état des localités (pastilles du panneau)
export const LOCALITY_STATES = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'actives', label: 'Actives' },
  { value: 'desactivees', label: 'Désactivées' },
]

function matchesState(locality, state) {
  if (state === 'actives') return locality.is_active
  if (state === 'desactivees') return !locality.is_active
  return true
}

// Nombre de localités par état, pour les pastilles
export function localityStateCounts(localities = []) {
  return Object.fromEntries(LOCALITY_STATES.map(({ value }) => [value, localities.filter((locality) => matchesState(locality, value)).length]))
}

// Localités filtrées par nom et par état, les actives d'abord puis par ordre alphabétique
export function visibleLocalities(localities = [], search = '', state = 'toutes') {
  const query = normalizeName(search)
  return localities
    .filter((locality) => matchesState(locality, state) && (!query || normalizeName(locality.name).includes(query)))
    .sort((first, second) => Number(second.is_active) - Number(first.is_active) || first.name.localeCompare(second.name, 'fr'))
}

// Origine d'une localité, pour le badge
export function localitySourceLabel(source) {
  return source === 'geonames' ? 'GeoNames' : 'Ajoutée à la main'
}

// Onglets de la page Communes (?onglet=). `admin` : réservé à l'admin (le backend refuse ces champs à un agent) ;
// `needsActive` : n'a de sens qu'avec une commune active.
export const MUNICIPALITY_TABS = [
  { value: 'regles', label: 'Règles', needsActive: true },
  { value: 'localites', label: 'Localités', needsActive: true },
  { value: 'chauffeurs', label: 'Espace chauffeur', needsActive: true, admin: true },
  { value: 'planning', label: 'Planning hebdomadaire', needsActive: true, admin: true },
  { value: 'communes', label: 'Autres communes', admin: true },
]

// Onglets proposés selon le rôle et la présence d'une commune active
export function municipalityTabs({ isAdmin, hasActive }) {
  return MUNICIPALITY_TABS.filter((tab) => (isAdmin || !tab.admin) && (hasActive || !tab.needsActive))
}

// Onglet affiché : celui de l'URL s'il est proposé, sinon le premier
export function readMunicipalityTab(searchParams, tabs) {
  const value = searchParams.get('onglet')
  return tabs.some((tab) => tab.value === value) ? value : tabs[0]?.value ?? null
}

// Contact de garde : valeurs du formulaire et champs modifiés (vide → null)
const ON_CALL_FIELDS = ['on_call_name', 'on_call_email', 'on_call_phone']

export function onCallFormValues(municipality) {
  return Object.fromEntries(ON_CALL_FIELDS.map((field) => [field, municipality[field] ?? '']))
}

export function onCallChanges(municipality, values) {
  const changes = {}
  for (const field of ON_CALL_FIELDS) {
    const next = values[field].trim() || null
    if (next !== (municipality[field] ?? null)) changes[field] = next
  }
  return changes
}

// Espace chauffeur : application de navigation ('' = par défaut) et délai du premier départ, avec un mode comme les
// distances ('defaut' → null, 'perso' → minutes de 0 à 240)
export const MIN_DEPARTURE_WINDOW = 0
export const MAX_DEPARTURE_WINDOW = 240

export function driverJourneyFormValues(municipality) {
  const stored = municipality.driver_departure_window_min
  return {
    navigation_engine: municipality.navigation_engine ?? '',
    departure_mode: stored == null ? 'defaut' : 'perso',
    driver_departure_window_min: stored == null ? '' : String(stored),
  }
}

export function driverJourneyChanges(municipality, values) {
  const changes = {}
  const engine = values.navigation_engine || null
  if (engine !== (municipality.navigation_engine ?? null)) changes.navigation_engine = engine
  const window = values.departure_mode === 'defaut' ? null : Number(values.driver_departure_window_min)
  if (window !== (municipality.driver_departure_window_min ?? null)) changes.driver_departure_window_min = window
  return changes
}
