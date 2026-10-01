import { addDays } from './planning'

// Onglets de « Mes missions » (?periode=) : à venir par défaut
export const MISSION_PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passees', label: 'Passées' },
]
export const DEFAULT_MISSION_PERIOD = 'a-venir'

// Nom fixe de l'onglet des itinéraires : sur PC, les clics suivants réutilisent le même onglet
// au lieu d'en ouvrir un nouveau à chaque fois (sur téléphone, le lien ouvre l'application de navigation).
export const ROUTE_TAB_NAME = 'oukilemonbus-itineraire'

export function readMissionSearch(searchParams) {
  const period = searchParams.get('periode') === 'passees' ? 'passees' : DEFAULT_MISSION_PERIOD
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  return { period, page }
}

// Missions listées au chauffeur : celles qui lui sont affectées et ont lieu (approuvées, en attente de confirmation par
// l'agent, ou confirmées). Les annulées et refusées n'encombrent pas la liste : le chauffeur est prévenu par une
// notification, dont le lien mène au détail (« Cette mission n'a plus lieu »).
export const MISSION_STATUSES = ['approuve', 'confirme']

// Paramètres de GET /reservations : le backend ne renvoie au chauffeur que ses missions, filtrées par statut.
//   à venir → à partir d'aujourd'hui, la plus proche d'abord
//   passées → jusqu'à hier, la plus récente d'abord
// `today` : jour à Bruxelles (AAAA-MM-JJ)
export function missionListParams(period, page, today) {
  if (period === 'passees') return { date_to: addDays(today, -1), statuses: MISSION_STATUSES, sort: 'desc', page }
  return { date_from: today, statuses: MISSION_STATUSES, sort: 'asc', page }
}

// Missions rangées par jour, dans l'ordre reçu : [{ day, missions }]
export function missionsByDay(missionList) {
  const groups = []
  missionList.forEach((mission) => {
    const lastGroup = groups.at(-1)
    if (lastGroup?.day === mission.trip_date) lastGroup.missions.push(mission)
    else groups.push({ day: mission.trip_date, missions: [mission] })
  })
  return groups
}

// Une mission annulée ou refusée n'a plus lieu
export function isCancelledMission(mission) {
  return ['annule', 'refuse'].includes(mission.status)
}

// Lieu pour Google Maps : coordonnées si on les a (plus précis), sinon l'adresse complète
function mapsLocation(location) {
  if (location?.latitude && location?.longitude) return `${location.latitude},${location.longitude}`
  return location?.formatted_address ?? ''
}

// Lien d'itinéraire Google Maps (sans compte ni clé). Sans `origin`, le départ est la position actuelle du téléphone.
export function mapsDirectionsUrl(destination, origin = null) {
  const params = new URLSearchParams({ api: '1', destination: mapsLocation(destination), travelmode: 'driving' })
  if (origin) params.set('origin', mapsLocation(origin))
  return `https://www.google.com/maps/dir/?${params}`
}
