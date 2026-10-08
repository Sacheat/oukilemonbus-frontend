import { getUsers } from '../api/users'

// Planning hebdomadaire envoyé automatiquement (backend : WeeklyPlanningService, docs/weekly_planning.md).

// Jours ISO du backend : 1 = lundi … 7 = dimanche
export const WEEKDAYS = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '7', label: 'Dimanche' },
]

export function weekdayLabel(day) {
  return WEEKDAYS.find((option) => option.value === String(day))?.label ?? ''
}

// Heures d'envoi proposées : au quart d'heure, car l'envoi est vérifié toutes les 15 minutes (planning:send-weekly) ;
// 12:07 partirait en fait à 12:15. Le backend refuse aussi une autre heure (422).
export const SEND_TIMES = Array.from({ length: 96 }, (_, index) => {
  const hours = String(Math.floor(index / 4)).padStart(2, '0')
  const minutes = String((index % 4) * 15).padStart(2, '0')
  return `${hours}:${minutes}`
})

// Liste du choix de l'heure ; une ancienne valeur hors quart d'heure reste affichée pour ne pas être changée en silence
export function sendTimeOptions(current) {
  return SEND_TIMES.includes(current) ? SEND_TIMES : [current, ...SEND_TIMES].filter(Boolean)
}

// Le responsable choisi diffère-t-il de celui enregistré ?
export function ownerHasChanged(municipality, owner) {
  return (owner?.id ?? null) !== (municipality.weekly_planning_owner_user_id ?? null)
}

// Valeurs du formulaire de la page Communes : celles appliquées (effective_*), pour montrer ce qui se passe vraiment
export function weeklyPlanningFormValues(municipality) {
  return {
    weekly_planning_enabled: Boolean(municipality.effective_weekly_planning_enabled),
    weekly_planning_send_day: String(municipality.effective_weekly_planning_send_day ?? 5),
    weekly_planning_send_time: municipality.effective_weekly_planning_send_time ?? '12:00',
  }
}

// Champs modifiés seulement (PATCH /municipalities/{id}) ; le responsable est comparé à part (`owner`)
export function weeklyPlanningChanges(municipality, values, owner) {
  const initial = weeklyPlanningFormValues(municipality)
  const changes = {}
  if (values.weekly_planning_enabled !== initial.weekly_planning_enabled) changes.weekly_planning_enabled = values.weekly_planning_enabled
  if (values.weekly_planning_send_day !== initial.weekly_planning_send_day) changes.weekly_planning_send_day = Number(values.weekly_planning_send_day)
  if (values.weekly_planning_send_time !== initial.weekly_planning_send_time) changes.weekly_planning_send_time = values.weekly_planning_send_time
  if (ownerHasChanged(municipality, owner)) changes.weekly_planning_owner_user_id = owner?.id ?? null
  return changes
}

// Comptes proposés comme responsable : agents et admins actifs (le backend refuse les autres).
// Deux recherches côté backend (un rôle chacune), fusionnées et triées par nom ; 15 au plus.
const OWNER_SEARCH_LIMIT = 15

export async function searchInternalAccounts(query, { signal } = {}) {
  const [agents, admins] = await Promise.all(
    ['agent_communal', 'admin'].map((role) => getUsers({ search: query, role, active: 1 }, { signal })),
  )
  const byId = new Map([...agents.data, ...admins.data].map((account) => [account.id, account]))
  const accounts = [...byId.values()].sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr'))
  return {
    accounts: accounts.slice(0, OWNER_SEARCH_LIMIT),
    hasMore: accounts.length > OWNER_SEARCH_LIMIT || agents.meta.last_page > 1 || admins.meta.last_page > 1,
  }
}

// Ce que change la désignation, annoncé dans la fenêtre de confirmation
export function ownerChangeText(owner) {
  if (owner) {
    return `Désormais, seul ${owner.full_name} recevra le planning hebdomadaire. Les autres agents et administrateurs ne le recevront plus, sauf s’ils l’activent dans leurs notifications. ${owner.full_name} sera prévenu.`
  }
  return 'Sans responsable, tous les agents et administrateurs recevront le planning hebdomadaire (sauf ceux qui l’ont coupé dans leurs notifications).'
}

// Préférence personnelle (GET /notifications/preferences) : null = automatique, true = toujours, false = jamais
export const OPT_IN_OPTIONS = [
  { value: 'auto', label: 'Automatique' },
  { value: 'always', label: 'Toujours' },
  { value: 'never', label: 'Jamais' },
]

export function optInChoice(value) {
  if (value === true) return 'always'
  if (value === false) return 'never'
  return 'auto'
}

export function optInValue(choice) {
  if (choice === 'always') return true
  if (choice === 'never') return false
  return null
}
