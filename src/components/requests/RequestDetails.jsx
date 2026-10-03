import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { formatDateTime } from '../../lib/dates'
import { RELATIONSHIP_TYPE_LABELS, REQUEST_STATUS_LABELS } from '../../lib/labels'
import { shortAddress } from '../../lib/reservations'
import { REQUEST_STATUS_TONES, requestSummary } from '../../lib/requests'
import { Badge } from '../ui/Badge'
import { DetailList } from '../ui/DetailList'
import { ConfidenceScore } from './ConfidenceScore'
import { ProofDocument } from './ProofDocument'

// Détail d'une demande pour l'agent : ce qui est demandé, le demandeur, le score de confiance (raisons et
// alertes), le justificatif et, une fois traitée, la décision. `kind` : adhesion | creation.
export function RequestDetails({ kind, request }) {
  const { can } = useAuth()
  const summary = requestSummary(kind, request)
  const requester = request.requested_by_user

  return (
    <>
      <section className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={REQUEST_STATUS_TONES[request.status] ?? 'neutral'}>
            {request.status_label ?? REQUEST_STATUS_LABELS[request.status]}
          </Badge>
          <span className="text-sm text-muted">Reçue le {formatDateTime(request.created_at)}</span>
        </div>
        {kind === 'adhesion' ? (
          <DetailList
            items={[
              ['Organisation', summary.title],
              request.organization?.type_label && ['Type', request.organization.type_label],
              ['Rôle demandé', RELATIONSHIP_TYPE_LABELS[request.requested_role] ?? request.requested_role],
              ['Justification', request.justification || 'Aucune'],
            ]}
          />
        ) : (
          <DetailList
            items={[
              ['Organisation', request.organization_name],
              ['Type', summary.detail],
              request.enterprise_number && ['Numéro BCE', request.enterprise_number],
              ['Email officiel', request.official_email],
              request.phone && ['Téléphone', request.phone],
              (request.contact_person_name || request.contact_person_role) && [
                'Personne de contact',
                [request.contact_person_name, request.contact_person_role].filter(Boolean).join(', '),
              ],
              ['Adresse', request.location ? shortAddress(request.location) : 'Non renseignée'],
              request.comment && ['Commentaire', request.comment],
            ]}
          />
        )}
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Demandeur</h3>
        <DetailList
          items={[
            ['Nom', requester?.full_name ?? 'Inconnu'],
            requester?.email && ['Email', requester.email],
            requester?.phone && ['Téléphone', requester.phone],
            requester && ['Compte', `${requester.active ? 'Actif' : 'Désactivé'}, email ${requester.email_verified_at ? 'vérifié' : 'non vérifié'}`],
          ]}
        />
        {requester && can('tooling.access') && (
          <Link to={`/gestion/outils?onglet=comptes&utilisateur=${requester.id}`} className="text-sm font-semibold text-link hover:underline">
            Diagnostic du compte
          </Link>
        )}
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Confiance</h3>
        <ConfidenceScore
          score={request.confidence_note}
          level={request.confidence_level}
          levelLabel={request.confidence_level_label}
          decided={request.status !== 'en_attente'}
          details={request.confidence_details}
        />
        <p className="text-xs text-muted">La note aide à trier les demandes ; elle ne remplace pas votre décision.</p>
      </section>

      <section className="grid gap-2 border-t border-line pt-5">
        <h3 className="font-bold">Justificatif</h3>
        {request.proof_document_id ? (
          <ProofDocument documentId={request.proof_document_id} />
        ) : (
          <p className="text-sm text-muted">
            {request.status === 'en_attente' ? 'Aucun justificatif fourni.' : 'Aucun justificatif (supprimé après la décision, ou jamais fourni).'}
          </p>
        )}
      </section>

      {request.status !== 'en_attente' && (
        <section className="grid gap-2 border-t border-line pt-5">
          <h3 className="font-bold">Décision</h3>
          <DetailList
            items={[
              ['Décision', request.status_label ?? REQUEST_STATUS_LABELS[request.status]],
              request.reviewed_at && ['Le', formatDateTime(request.reviewed_at)],
              request.reviewed_by_user && ['Par', request.reviewed_by_user.full_name],
              request.rejection_reason && ['Motif', request.rejection_reason],
            ]}
          />
        </section>
      )}
    </>
  )
}
