import { brusselsNow, formatTime, toLocalMinute } from './dates'

// Choix du formulaire du compte rendu
export const OUTCOME_OPTIONS = [
  { value: 'realise', label: 'Réalisé' },
  { value: 'non_realise', label: 'Non réalisé' },
]

// Valeurs de départ : le compte rendu existant, sinon l'horaire et les passagers prévus (le chauffeur corrige l'écart)
export function tripReportFormValues(report, mission) {
  if (report) {
    return {
      outcome: report.outcome,
      actual_departure_time: report.actual_departure_time ?? formatTime(mission.departure_time),
      actual_return_time: report.actual_return_time ?? formatTime(mission.return_time),
      actual_nb_children: String(report.actual_nb_children ?? mission.nb_children),
      actual_nb_adults: String(report.actual_nb_adults ?? mission.nb_adults),
      remarks: report.remarks ?? '',
    }
  }
  return {
    outcome: '',
    actual_departure_time: formatTime(mission.departure_time),
    actual_return_time: formatTime(mission.return_time),
    actual_nb_children: String(mission.nb_children),
    actual_nb_adults: String(mission.nb_adults),
    remarks: '',
  }
}

// Le trajet a-t-il commencé ? (date + heure de départ, en heure de Bruxelles)
export function hasTripStarted(mission, now = new Date()) {
  return `${mission.trip_date.slice(0, 10)}T${formatTime(mission.departure_time)}` <= brusselsNow(now)
}

// Badge d'un trajet dans une liste :
//   compte rendu « réalisé »                    → Réalisé (vert)
//   compte rendu « non réalisé »                → Non réalisé (rouge)
//   confirmé, commencé, sans compte rendu       → À confirmer (orange)
//   sinon                                       → rien
export function tripReportBadge(report, mission, now = new Date()) {
  if (report?.outcome === 'realise') return { label: 'Réalisé', tone: 'success' }
  if (report?.outcome === 'non_realise') return { label: 'Non réalisé', tone: 'danger' }
  if (mission.status === 'confirme' && hasTripStarted(mission, now)) return { label: 'À confirmer', tone: 'warning' }
  return null
}

// Compte rendu en attente pour le chauffeur : trajet confirmé, commencé, sans compte rendu, et délai pas encore dépassé
// (le lendemain à 12:00, même règle que le backend : TripReportService::DRIVER_GRACE_UNTIL)
export function isReportPending(mission, report, now = new Date()) {
  if (report || mission.status !== 'confirme' || !hasTripStarted(mission, now)) return false
  return brusselsNow(now) <= `${nextDay(mission.trip_date.slice(0, 10))}T12:00`
}

function nextDay(day) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10)
}

// Index { reservation_id: compte rendu } à partir d'une liste
export function reportsByReservation(reportList) {
  return Object.fromEntries((reportList ?? []).map((report) => [report.reservation_id, report]))
}

// Fenêtre de déclaration du chauffeur (meta du backend, heure locale) : 'avant' | 'ouverte' | 'fermee'
export function driverWindowState(meta, now = new Date()) {
  const current = brusselsNow(now)
  if (current < toLocalMinute(meta.driver_window_opens_at)) return 'avant'
  if (current > toLocalMinute(meta.driver_window_closes_at)) return 'fermee'
  return 'ouverte'
}
