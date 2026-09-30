import { useCallback } from 'react'
import { getCouncilDecisions, getDocuments } from '../../api/documents'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../lib/dates'
import { DECISION_STATUS } from '../../lib/documents'
import { Badge } from '../ui/Badge'
import { DetailList } from '../ui/DetailList'
import { Panel } from '../ui/Panel'
import { DocumentRow } from './DocumentRow'

// Carte « Décision et documents » du détail d'un déplacement : décision du Collège (ASBL, CPAS,
// externes) et documents de la réservation. Rien n'est affiché s'il n'y a ni l'un ni l'autre.
export function TripDocumentsCard({ reservationId }) {
  const fetchData = useCallback(
    async (signal) => {
      const [decisions, documents] = await Promise.all([
        getCouncilDecisions({ reservation_id: reservationId }, { signal }),
        getDocuments({ signal }),
      ])
      return {
        decision: decisions.data.find((item) => item.reservation_id === reservationId) ?? null,
        documents: documents.filter((doc) => doc.reservation_id === reservationId),
      }
    },
    [reservationId],
  )
  const { data } = useApi(fetchData)

  // Complément du détail : en cas d'erreur ou pendant le chargement, la carte ne s'affiche pas
  if (!data || (!data.decision && data.documents.length === 0)) return null
  const { decision, documents } = data
  const status = decision && DECISION_STATUS[decision.decision_status]

  return (
    <Panel title="Décision et documents">
      {decision && (
        <div className="px-5 pb-3">
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Décision du Collège</span>
            <Badge tone={status?.tone ?? 'neutral'}>{status?.label ?? decision.decision_status}</Badge>
          </div>
          <DetailList
            items={[
              decision.decision_date && ['Date de la décision', formatDate(decision.decision_date)],
              decision.decision_reference && ['Référence', decision.decision_reference],
              decision.notes && ['Remarques', decision.notes],
            ]}
          />
        </div>
      )}
      {documents.length > 0 && (
        <ul className={decision ? 'divide-y divide-line border-t border-line' : 'divide-y divide-line'}>
          {documents.map((doc) => (
            <DocumentRow key={doc.id} document={doc} showReservation={false} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
