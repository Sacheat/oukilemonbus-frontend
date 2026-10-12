import { brusselsNow, formatLocalPeriod, toLocalMinute } from './dates'
import { periodLength } from './planning'

// Valeur de ?indisponibilite= pour ouvrir le formulaire de déclaration
export const NEW_UNAVAILABILITY = 'nouvelle'

// Onglets de la page (?periode=), « en cours et à venir » par défaut
export const UNAVAILABILITY_PERIODS = [
  { value: 'a-venir', label: 'En cours et à venir' },
  { value: 'passees', label: 'Passées' },
  { value: 'annulees', label: 'Annulées' },
]
export const DEFAULT_PERIOD = 'a-venir'

export const REASON_TYPE_LABELS = { driver: 'Chauffeur', vehicle: 'Véhicule' }

// La réponse de création renvoie is_active à null : seule la valeur false signifie « annulée »
export function isActiveUnavailability(unavailability) {
  return unavailability.is_active !== false
}

// Les dates des indisponibilités sont des heures de Bruxelles sans fuseau ("2026-06-10T08:00:00"),
// comme les réservations : aucune conversion. Pour comparer, tout est ramené à "AAAA-MM-JJTHH:mm"
// (toLocalMinute pour l'API, brusselsNow pour maintenant) ; ce format se compare comme du texte.

// Range une indisponibilité dans un onglet :
//   si annulée                      → 'annulees'
//   sinon si la fin est déjà passée → 'passees'
//   sinon                           → 'a-venir' (en cours ou à venir)
export function getUnavailabilityPeriod(unavailability, now = new Date()) {
  if (!isActiveUnavailability(unavailability)) return 'annulees'
  if (toLocalMinute(unavailability.end_datetime) <= brusselsNow(now)) return 'passees'
  return 'a-venir'
}

// En cours : commencée mais pas encore terminée
export function isOngoing(unavailability, now = new Date()) {
  const currentMinute = brusselsNow(now)
  return (
    isActiveUnavailability(unavailability) &&
    toLocalMinute(unavailability.start_datetime) <= currentMinute &&
    currentMinute < toLocalMinute(unavailability.end_datetime)
  )
}

// Ce qui est indisponible, en toutes lettres : nom du chauffeur ou plaque du véhicule, envoyés par le backend avec
// chaque indisponibilité (aussi pour un chauffeur ou un bus désactivé depuis)
export function unavailabilitySubject(unavailability) {
  if (unavailability.reason_type === 'driver') {
    return unavailability.driver?.name || `Chauffeur n° ${unavailability.driver_id}`
  }
  return unavailability.vehicle?.licence_plate || `Véhicule n° ${unavailability.vehicle_id}`
}

// Onglet de l'URL (?periode=a-venir) → valeur de l'API (period=a_venir)
const PERIOD_API = { 'a-venir': 'a_venir', passees: 'passees', annulees: 'annulees' }

// Filtres de la page lus dans l'URL : ?periode=&chauffeur=&vehicule=&page= (valeurs inconnues → par défaut)
export function readUnavailabilitySearch(searchParams, periods = UNAVAILABILITY_PERIODS) {
  const asked = searchParams.get('periode')
  const id = (name) => (/^\d+$/.test(searchParams.get(name) ?? '') ? searchParams.get(name) : '')
  return {
    period: periods.some((option) => option.value === asked) ? asked : DEFAULT_PERIOD,
    driverId: id('chauffeur'),
    vehicleId: id('vehicule'),
    page: Math.max(1, Number(searchParams.get('page')) || 1),
  }
}

// Paramètres de GET /unavailabilities : un onglet, une page, les filtres choisis
export function unavailabilityListParams({ period, driverId, vehicleId, page }) {
  return {
    period: PERIOD_API[period] ?? PERIOD_API[DEFAULT_PERIOD],
    ...(driverId ? { driver_id: Number(driverId) } : {}),
    ...(vehicleId ? { vehicle_id: Number(vehicleId) } : {}),
    page,
  }
}

// Nombres des onglets renvoyés par le backend (meta.period_counts), aux clés de l'URL : { 'a-venir': 2, passees: 5… }
export function periodCounts(meta) {
  if (!meta?.period_counts) return null
  return Object.fromEntries(Object.entries(PERIOD_API).map(([value, apiValue]) => [value, meta.period_counts[apiValue] ?? 0]))
}

// Listes de choix : seulement les chauffeurs et véhicules actifs sont chargés. Si l'indisponibilité ouverte concerne
// un chauffeur ou un bus désactivé depuis, on l'ajoute à partir de ce que renvoie le backend, pour qu'il reste choisi.
export function withOpenedDriver(driverList, unavailability) {
  const driver = unavailability?.driver
  if (!driver || driverList.some((item) => item.id === driver.id)) return driverList
  const [firstName = '', ...rest] = (driver.name ?? '').split(' ')
  return [...driverList, { id: driver.id, is_active: false, user: { full_name: driver.name, first_name: firstName, last_name: rest.join(' ') } }]
}

export function withOpenedVehicle(vehicleList, unavailability) {
  const vehicle = unavailability?.vehicle
  if (!vehicle || vehicleList.some((item) => item.id === vehicle.id)) return vehicleList
  return [...vehicleList, { id: vehicle.id, is_active: false, licence_plate: vehicle.licence_plate }]
}

// Chauffeurs proposés : les actifs, triés par nom, plus celui déjà choisi s'il a été désactivé depuis
export function driverOptions(driverList, selectedDriverId) {
  return driverList
    .filter((driver) => driver.is_active || driver.id === selectedDriverId)
    .sort((first, second) =>
      (first.user?.last_name ?? '').localeCompare(second.user?.last_name ?? '', 'fr') ||
      (first.user?.first_name ?? '').localeCompare(second.user?.first_name ?? '', 'fr'),
    )
}

// Véhicules proposés : les actifs, triés par plaque, plus celui déjà choisi s'il a été retiré depuis
export function vehicleOptions(vehicleList, selectedVehicleId) {
  return vehicleList
    .filter((vehicle) => vehicle.is_active || vehicle.id === selectedVehicleId)
    .sort((first, second) => first.licence_plate.localeCompare(second.licence_plate, 'fr'))
}

// Valeurs de départ du formulaire. Début et fin au format de <input type="datetime-local"> ("AAAA-MM-JJTHH:mm"),
// repris tels quels de l'API (heure locale) ; les noms des champs sont ceux du backend pour y ranger les erreurs 422.
export function unavailabilityFormValues(unavailability) {
  return {
    reason_type: unavailability?.reason_type ?? '',
    driver_id: unavailability?.driver_id ? String(unavailability.driver_id) : '',
    vehicle_id: unavailability?.vehicle_id ? String(unavailability.vehicle_id) : '',
    start_datetime: toLocalMinute(unavailability?.start_datetime),
    end_datetime: toLocalMinute(unavailability?.end_datetime),
    reason: unavailability?.reason ?? '',
    change_reason: '',
  }
}

// Durée d'une indisponibilité, pour la liste : moins de 24 h en heures (« 3 h », « 2 h 30 »), même à cheval sur minuit ;
// au-delà, en jours de calendrier comptés début et fin compris (« 3 jours » du 09/10 au 11/10). Heures de Bruxelles
// sans fuseau : les deux bornes sont lues de la même façon.
export function unavailabilityDuration({ start_datetime: start, end_datetime: end }) {
  if (!start || !end) return ''
  const minutesOf = (value) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number)
    return Date.UTC(year, month - 1, day, Number(value.slice(11, 13)), Number(value.slice(14, 16))) / 60_000
  }
  const minutes = Math.max(0, minutesOf(end) - minutesOf(start))
  if (minutes < 24 * 60) {
    const rest = minutes % 60
    return `${Math.floor(minutes / 60)} h${rest ? ` ${String(rest).padStart(2, '0')}` : ''}`
  }
  return `${periodLength(start.slice(0, 10), end.slice(0, 10))} jours`
}

// Ce qui a changé dans une entrée de l'historique : [{ label, before, after }] (type, période, motif), vide pour une
// annulation ou un enregistrement sans changement. Les heures sont comparées à la minute (toLocalMinute).
export function historyChanges(entry) {
  const changes = []
  if (entry.old_reason_type !== entry.new_reason_type) {
    changes.push({
      label: 'Concerne',
      before: REASON_TYPE_LABELS[entry.old_reason_type] ?? '—',
      after: REASON_TYPE_LABELS[entry.new_reason_type] ?? '—',
    })
  }
  const periodChanged =
    toLocalMinute(entry.old_start_datetime) !== toLocalMinute(entry.new_start_datetime) ||
    toLocalMinute(entry.old_end_datetime) !== toLocalMinute(entry.new_end_datetime)
  if (periodChanged) {
    changes.push({
      label: 'Période',
      before: formatLocalPeriod(entry.old_start_datetime, entry.old_end_datetime) || '—',
      after: formatLocalPeriod(entry.new_start_datetime, entry.new_end_datetime) || '—',
    })
  }
  if ((entry.old_reason ?? '') !== (entry.new_reason ?? '')) {
    changes.push({ label: 'Motif', before: entry.old_reason || '—', after: entry.new_reason || '—' })
  }
  return changes
}
