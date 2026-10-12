import { addDays } from './planning'

// Onglets de « Mes missions » (?periode=) : à venir par défaut
export const MISSION_PERIODS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passees', label: 'Passées' },
]
export const DEFAULT_MISSION_PERIOD = 'a-venir'

// Nom fixe de l'onglet des itinéraires : sur PC, les clics suivants réutilisent le même onglet
// au lieu d'en ouvrir un nouveau à chaque fois (sur téléphone, le lien ouvre l'application de navigation).
// Onglet nommé des itinéraires web (sur PC, réutilisé aux clics suivants ; voir lib/navigation.js)
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
// `today` : jour à Bruxelles (AAAA-MM-JJ). Compte rendu joint à chaque mission (include=trip_report) : badges sans
// second appel.
export function missionListParams(period, page, today) {
  if (period === 'passees') {
    return { date_to: addDays(today, -1), statuses: MISSION_STATUSES, sort: 'desc', include: 'trip_report', page }
  }
  return { date_from: today, statuses: MISSION_STATUSES, sort: 'asc', include: 'trip_report', page }
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

// Kilomètres d'une mission : aller-retour. distance_km (backend) ne mesure que l'aller, départ → destination ;
// le bus revient ensuite au lieu de départ (même règle que les feuilles de route : round_trip_km).
export function roundTripKmText(mission) {
  return `${(Number(mission.distance_km) * 2).toLocaleString('fr-BE', { maximumFractionDigits: 1 })} km`
}

// Statut affiché sur une mission seulement s'il apprend quelque chose : « Confirmé » est le cas normal
// (même règle que les cartes du Planning) ; « Approuvé » dit que l'agent n'a pas encore confirmé
export function showsMissionStatus(mission) {
  return mission.status !== 'confirme'
}
