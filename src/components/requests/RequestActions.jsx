import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { approveRequest, rejectRequest } from '../../api/requests'
import { approvalEffect, requestIdOf, roleAlreadyHeldWarning } from '../../lib/requests'
import { ReasonModal } from '../backoffice/ReasonModal'
import { ConfirmModal } from '../tooling/ConfirmModal'
import { Button } from '../ui/Button'

// Approuver (confirmé, avec l'effet annoncé) ou refuser (motif obligatoire) une demande en attente.
// L'avertissement « Rôle déjà tenu » est rappelé dans la fenêtre d'approbation.
// `onDecided(message)` après un succès ; le backend refuse une demande déjà traitée (422, affiché dans la fenêtre).
export function RequestActions({ kind, request, onDecided }) {
  const [confirming, setConfirming] = useState(null) // 'approve' | 'reject'
  const id = requestIdOf(kind, request)
  const name = kind === 'adhesion' ? request.organization?.name : request.organization_name
  const roleHeld = roleAlreadyHeldWarning(request.confidence_details?.warnings)

  return (
    <section className="flex flex-wrap gap-2 border-t border-line pt-5">
      <Button onClick={() => setConfirming('approve')}>
        <Check className="size-4" aria-hidden="true" /> Approuver
      </Button>
      <Button variant="secondary" onClick={() => setConfirming('reject')}>
        <X className="size-4" aria-hidden="true" /> Refuser
      </Button>

      <ConfirmModal
        open={confirming === 'approve'}
        title={kind === 'adhesion' ? 'Approuver l’adhésion' : 'Approuver la création'}
        confirmLabel="Approuver"
        action={() => approveRequest(kind, id)}
        onClose={() => setConfirming(null)}
        onDone={() => {
          setConfirming(null)
          onDecided(kind === 'adhesion' ? `Adhésion approuvée : ${request.requested_by_user?.full_name} rejoint ${name}.` : `Organisation créée : ${name}.`)
        }}
      >
        <p>{approvalEffect(kind, request)}</p>
        {roleHeld && (
          <p className="mt-3 font-semibold">
            {roleHeld} L’approbation ajoutera un second responsable.
          </p>
        )}
      </ConfirmModal>

      <ReasonModal
        open={confirming === 'reject'}
        onClose={() => setConfirming(null)}
        title="Refuser la demande"
        intro={`Le motif est envoyé à ${request.requested_by_user?.full_name ?? 'la personne'}. Le justificatif éventuel sera supprimé.`}
        label="Motif du refus"
        submitLabel="Refuser"
        action={(reason) => rejectRequest(kind, id, reason)}
        onDone={() => {
          setConfirming(null)
          onDecided(`Demande refusée : ${name}.`)
        }}
      />
    </section>
  )
}
