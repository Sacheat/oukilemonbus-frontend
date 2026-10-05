import { Download, ExternalLink } from 'lucide-react'
import { useCallback } from 'react'
import { Link } from 'react-router'
import { getReservationDecision } from '../../../api/documents'
import { useApi } from '../../../hooks/useApi'
import { useDocumentFile } from '../../../hooks/useDocumentFile'
import { formatDate, formatDateTime } from '../../../lib/dates'
import { planningDayLink } from '../../../lib/dashboard'
import { formatFileSize } from '../../../lib/documents'
import { DOCUMENT_TYPE_LABELS } from '../../../lib/labels'
import { RegenerateDeliberation } from '../../college/RegenerateDeliberation'
import { Alert } from '../../ui/Alert'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { DetailList } from '../../ui/DetailList'
import { ErrorState } from '../../ui/ErrorState'
import { Loader } from '../../ui/Loader'

// Délibération : la décision du Collège de sa réservation (une seule par réservation) sert à régénérer le PDF
function DeliberationActions({ doc, onRegenerated }) {
  const fetchDecision = useCallback((signal) => getReservationDecision(doc.reservation_id, { signal }), [doc.reservation_id])
  const decision = useApi(fetchDecision)

  if (decision.error) return <ErrorState error={decision.error} onRetry={decision.reload} />
  if (decision.data === undefined) return <Loader />
  if (!decision.data) return <Alert tone="warning">Aucune décision du Collège n'est enregistrée pour cette réservation.</Alert>
  return <RegenerateDeliberation decisionId={decision.data.id} onDone={onRegenerated} />
}

// Panneau d'un document de /gestion/documents (?document=id), écrit en « si… sinon… » : chargement, erreur, fiche.
// `opened` : { document, loading, error, reload } (le document est relu par son id, avec sa réservation).
export function DocumentDrawerContent({ opened, canGenerate, onRegenerated }) {
  const { document: doc } = opened
  const file = useDocumentFile(doc ?? { id: null, file_name: '' })

  if (!doc) {
    return opened.error ? <ErrorState error={opened.error} onRetry={opened.reload} /> : <Loader />
  }

  const reservation = doc.reservation
  const type = doc.document_type_label ?? DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{type}</Badge>
        {doc.version > 1 && <Badge tone="info">Version {doc.version}</Badge>}
        {doc.is_official && <Badge tone="success">Officiel</Badge>}
        {doc.is_available === false && <Badge tone="danger">Fichier indisponible</Badge>}
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={file.open} loading={file.busy === 'open'} disabled={file.busy !== null}>
            <ExternalLink className="size-4" aria-hidden="true" /> Ouvrir
          </Button>
          <Button variant="secondary" onClick={file.download} loading={file.busy === 'download'} disabled={file.busy !== null}>
            <Download className="size-4" aria-hidden="true" /> Télécharger
          </Button>
        </div>
        {file.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {file.error}
          </p>
        )}
      </div>

      <DetailList
        items={[
          ['Fichier', <span key="name" className="break-all">{doc.file_name}</span>],
          ['Taille', formatFileSize(doc.file_size)],
          ['Créé le', formatDateTime(doc.generated_at ?? doc.created_at)],
          doc.service_date && ['Jour de service', formatDate(doc.service_date, { day: 'numeric', month: 'long', year: 'numeric' })],
          doc.vehicle && ['Véhicule', doc.vehicle.licence_plate],
          ['Version', doc.version],
          ['Auteur', doc.user?.full_name],
          reservation && [
            'Réservation',
            <Link key="reservation" to={planningDayLink(reservation.trip_date, reservation.id)} className="text-link hover:underline">
              {reservation.trip_purpose} · {formatDate(reservation.trip_date, { day: 'numeric', month: 'long', year: 'numeric' })}
            </Link>,
          ],
        ]}
      />

      {canGenerate && doc.document_type === 'deliberation' && doc.reservation_id && (
        <section aria-labelledby="regeneration" className="grid gap-2">
          <h3 id="regeneration" className="text-sm font-extrabold tracking-[.1em] text-muted uppercase">
            Délibération
          </h3>
          <p className="text-sm text-muted">Génère une nouvelle version du PDF à partir de la décision du Collège.</p>
          <DeliberationActions doc={doc} onRegenerated={onRegenerated} />
        </section>
      )}
    </>
  )
}
