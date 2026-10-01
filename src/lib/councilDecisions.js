import { DECISION_STATUS } from './documents'

// Onglets de la page (?onglet=) : « À décider » par défaut
export const COLLEGE_TABS = [
  { value: 'a-decider', label: 'À décider' },
  { value: 'approuvees', label: 'Approuvées' },
  { value: 'refusees', label: 'Refusées' },
]
export const DEFAULT_TAB = 'a-decider'

// Statut de décision filtré par chaque onglet de décisions
export const TAB_DECISION_STATUS = { approuvees: 'approuve', refusees: 'refuse' }

// Choix du formulaire, dans l'ordre où l'agent les lit
export const DECISION_OPTIONS = ['approuve', 'refuse', 'en_attente'].map((value) => ({
  value,
  label: DECISION_STATUS[value].label,
}))

// Valeur de ?reservation= : la réservation dont le panneau est ouvert
export function readCollegeSearch(searchParams) {
  const tab = COLLEGE_TABS.some((item) => item.value === searchParams.get('onglet')) ? searchParams.get('onglet') : DEFAULT_TAB
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  return { tab, page, openedReservationId: searchParams.get('reservation') }
}

// Valeurs de départ du formulaire : celles de la décision existante, sinon vides avec la date du jour
export function decisionFormValues(decision, today) {
  return {
    decision_status: decision?.decision_status ?? '',
    decision_date: decision?.decision_date ?? today,
    decision_reference: decision?.decision_reference ?? '',
    notes: decision?.notes ?? '',
  }
}

// Ce que l'agent peut faire sur la décision d'une réservation (mêmes règles que le backend) :
//   trajet passé (avant aujourd'hui à Bruxelles) avec une décision → 'notes'     : seules les notes se corrigent
//   trajet passé sans décision                                     → 'trop-tard' : plus rien à encoder
//   réservation refusée ou annulée, trajet à venir                 → 'lecture'
//   sinon                                                          → 'complet'
export function decisionEditMode(reservation, decision, today) {
  const tripPassed = reservation.trip_date.slice(0, 10) < today
  if (tripPassed) return decision ? 'notes' : 'trop-tard'
  if (['refuse', 'annule'].includes(reservation.status)) return 'lecture'
  return 'complet'
}

// Un refus a des conséquences définitives (réservation refusée, demandeur prévenu) : on demande confirmation,
// sauf si la décision était déjà « refusée » (simple correction de la référence ou des notes)
export function needsRefusalConfirmation(values, existingDecision) {
  return values.decision_status === 'refuse' && existingDecision?.decision_status !== 'refuse'
}

// Libellé du bouton du formulaire de décision
export function submitLabel(notesOnly, existingDecision) {
  if (notesOnly) return 'Enregistrer les notes'
  if (existingDecision) return 'Enregistrer la modification'
  return 'Enregistrer la décision'
}

// Message après l'enregistrement, selon la décision
export function decisionSavedMessage(decision) {
  if (decision.decision_status === 'approuve') {
    return (
      'Décision enregistrée : approuvée. La délibération a été générée et le demandeur prévenu. ' +
      'La réservation peut maintenant être approuvée par un agent.'
    )
  }
  if (decision.decision_status === 'refuse') {
    return 'Décision enregistrée : refusée. La réservation a été refusée, la délibération générée et le demandeur prévenu.'
  }
  return 'Décision enregistrée : en attente. La réservation reste en attente du Collège.'
}
