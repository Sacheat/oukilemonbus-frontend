import { brusselsNow, toLocalMinute } from './dates'
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

// Indisponibilités d'un onglet, triées : la plus proche d'abord pour « à venir »,
// la plus récente d'abord pour « passées » et « annulées »
export function unavailabilitiesForPeriod(unavailabilityList, period, now = new Date()) {
  const byStart = (first, second) =>
    toLocalMinute(first.start_datetime).localeCompare(toLocalMinute(second.start_datetime))
  const inPeriod = unavailabilityList.filter((unavailability) => getUnavailabilityPeriod(unavailability, now) === period)
  return period === 'a-venir' ? inPeriod.sort(byStart) : inPeriod.sort((first, second) => byStart(second, first))
}

// Nombre d'indisponibilités par onglet : { 'a-venir': 2, passees: 5, annulees: 1 }
export function countByPeriod(unavailabilityList, now = new Date()) {
  const counts = Object.fromEntries(UNAVAILABILITY_PERIODS.map((period) => [period.value, 0]))
  unavailabilityList.forEach((unavailability) => {
    counts[getUnavailabilityPeriod(unavailability, now)] += 1
  })
  return counts
}

// Ce qui est indisponible, en toutes lettres : nom du chauffeur ou plaque du véhicule.
// Le backend ne renvoie que les id : on cherche dans les listes chargées par la page.
export function unavailabilitySubject(unavailability, driverList, vehicleList) {
  if (unavailability.reason_type === 'driver') {
    const driver = driverList.find((item) => item.id === unavailability.driver_id)
    return driver?.user?.full_name ?? `Chauffeur n° ${unavailability.driver_id}`
  }
  const vehicle = vehicleList.find((item) => item.id === unavailability.vehicle_id)
  return vehicle?.licence_plate ?? `Véhicule n° ${unavailability.vehicle_id}`
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
