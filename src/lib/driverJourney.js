import { MISSION_STATUSES } from './driverMissions'
import { addDays, isValidDay, todayInBrussels } from './planning'
import { routeDistanceText } from './navigation'

// « Ma journée » du chauffeur : une page par jour, une carte par trajet, quatre étapes par trajet.
// L'ordre et les heures sont vérifiés par le backend (TripProgressService) ; le front n'active que l'étape suivante.

// Étapes d'un trajet, dans l'ordre : l'aller (lieu de départ → destination), puis le retour
export const JOURNEY_STEPS = [
  { type: 'depart_aller', leg: 'Aller', label: 'Départ', doneLabel: 'Parti' },
  { type: 'arrivee_aller', leg: 'Aller', label: 'Arrivée', doneLabel: 'Arrivé' },
  { type: 'depart_retour', leg: 'Retour', label: 'Départ', doneLabel: 'Parti' },
  { type: 'arrivee_retour', leg: 'Retour', label: 'Arrivée', doneLabel: 'Arrivé' },
]

export const LAST_STEP = 'arrivee_retour'

// Badge de l'avancement d'un trajet (Ma journée, Planning) ; rien tant que le trajet n'a pas commencé
export const PROGRESS_BADGES = {
  en_route_aller: { label: 'En route', tone: 'info' },
  sur_place: { label: 'Sur place', tone: 'info' },
  en_route_retour: { label: 'Retour en cours', tone: 'info' },
  termine: { label: 'Terminé', tone: 'success' },
}

// Jour affiché (?jour=AAAA-MM-JJ), aujourd'hui à Bruxelles par défaut
export function readJourneyDay(searchParams, now = new Date()) {
  const day = searchParams.get('jour')
  return isValidDay(day) ? day : todayInBrussels(now)
}

// Missions du jour : approuvées (en attente de confirmation par l'agent) et confirmées, dans l'ordre de la journée
export function dayMissionsParams(day) {
  return { date_from: day, date_to: day, statuses: MISSION_STATUSES, sort: 'asc' }
}

// Prochain jour (ou jour précédent) qui a des missions : la première mission après (ou avant) le jour affiché
export function neighbourDayParams(day, direction) {
  return direction === 'next'
    ? { date_from: addDays(day, 1), statuses: MISSION_STATUSES, sort: 'asc' }
    : { date_to: addDays(day, -1), statuses: MISSION_STATUSES, sort: 'desc' }
}

// Index { reservation_id: avancement } à partir de la liste du backend
export function progressByReservation(progressList) {
  return Object.fromEntries((progressList ?? []).map((progress) => [progress.reservation_id, progress]))
}

// État d'une étape pour ses boutons :
//   enregistrée            → 'done' (bouton éteint, avec son heure)
//   étape suivante         → 'next' (seul bouton actif)
//   plus loin dans l'ordre → 'locked'
export function stepStatus(progress, type) {
  const event = progress?.events?.find((item) => item.type === type)
  if (event) return { status: 'done', event }
  const next = progress ? progress.next_step : 'depart_aller'
  return { status: next === type ? 'next' : 'locked', event: null }
}

// Trajet à mettre en avant : le premier de la journée qui n'est pas terminé
export function currentMissionId(missionList, progressMap) {
  return missionList.find((mission) => progressMap[mission.id]?.state !== 'termine')?.id ?? null
}

// Libellé d'une position enregistrée (pour le chauffeur et l'agent)
export function positionStateText(state) {
  if (state === 'envoyee') return 'position envoyée'
  if (state === 'refusee') return 'position refusée'
  return 'position indisponible'
}

// Contrôle des étapes (meta.step_checks de GET /reservations/{id}/trip-progress, agents et admins) indexé par type :
// { depart_aller: { expected_place, expected_latitude, expected_longitude, distance_m, far_from_expected }, … }
export function stepChecksByType(stepChecks) {
  return Object.fromEntries((stepChecks ?? []).map((check) => [check.type, check]))
}

// « à 1,3 km du lieu de départ prévu », « à 160 m de la destination prévue »
export function stepDistanceText(check) {
  if (check?.distance_m == null) return null
  return `à ${routeDistanceText(check.distance_m)} ${check.expected_place === 'destination' ? 'de la destination prévue' : 'du lieu de départ prévu'}`
}
