import { formatDate } from '../../lib/dates'
import { Alert } from '../ui/Alert'
import { DetailList } from '../ui/DetailList'
import { DecisionForm } from './DecisionForm'

// Partie « décision » du panneau, selon editMode (decisionEditMode dans lib/councilDecisions.js) :
//   'complet'   → formulaire complet (création ou modification)
//   'notes'     → trajet passé : statut, date et référence figés, seules les notes se corrigent
//   'trop-tard' → trajet passé sans décision : plus rien à encoder
//   'lecture'   → réservation refusée ou annulée : décision en lecture seule
export function DecisionSection({ reservation, decision, editMode, onSaved }) {
  if (editMode === 'complet') {
    return <DecisionForm key={decision?.id ?? 'nouvelle'} reservation={reservation} existingDecision={decision} onSaved={onSaved} />
  }

  if (editMode === 'notes') {
    return (
      <>
        <Alert>Le trajet est passé : la décision est figée, seules les notes peuvent encore être corrigées.</Alert>
        <FrozenDecision decision={decision} />
        <DecisionForm key={decision.id} reservation={reservation} existingDecision={decision} onSaved={onSaved} notesOnly />
      </>
    )
  }

  if (editMode === 'trop-tard') {
    return <Alert>Le trajet est passé : aucune décision du Collège ne peut plus être encodée.</Alert>
  }

  return (
    <>
      <Alert>
        Cette réservation est {reservation.status === 'refuse' ? 'refusée' : 'annulée'} : la décision ne peut plus être
        modifiée.
      </Alert>
      {decision && <FrozenDecision decision={decision} withNotes />}
    </>
  )
}

// Séance, référence (et notes) d'une décision qui ne peut plus changer
function FrozenDecision({ decision, withNotes = false }) {
  return (
    <DetailList
      items={[
        ['Séance', decision.decision_date ? formatDate(decision.decision_date) : 'non renseignée'],
        ['Référence', decision.decision_reference ?? 'non renseignée'],
        withNotes && decision.notes && ['Notes', decision.notes],
      ]}
    />
  )
}
