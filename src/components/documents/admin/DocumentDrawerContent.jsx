import { ArrowRight, Download, ExternalLink } from 'lucide-react'
import { useCallback } from 'react'
import { Link } from 'react-router'
import { getReservationDecision } from '../../../api/documents'
import { useAuth } from '../../../auth/useAuth'
import { useApi } from '../../../hooks/useApi'
import { useDocumentFile } from '../../../hooks/useDocumentFile'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { formatDate, formatDateTime } from '../../../lib/dates'
import { deliberationDecision, documentLink, documentPeriod, formatDayRange, isPlanningExport } from '../../../lib/documentsAdmin'
import { canOpenInBrowser, formatFileSize } from '../../../lib/documents'
import { DOCUMENT_TYPE_LABELS } from '../../../lib/labels'
import { RegenerateDeliberation } from '../../college/RegenerateDeliberation'
import { Alert } from '../../ui/Alert'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { DetailList } from '../../ui/DetailList'
import { ErrorState } from '../../ui/ErrorState'
import { Loader } from '../../ui/Loader'
import { DocumentPreview } from './DocumentPreview'

const LONG_DAY = { day: 'numeric', month: 'long', year: 'numeric' }

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
// Fiche : actions sur le fichier, lien vers l'endroit où agir, aperçu du PDF en grand écran, détails.
export function DocumentDrawerContent({ opened, canGenerate, onRegenerated }) {
  const { can } = useAuth()
  const { document: doc } = opened
  const file = useDocumentFile(doc ?? { id: null, file_name: '' })
  const wide = useMediaQuery('(min-width: 1024px)')

  if (!doc) {
    return opened.error ? <ErrorState error={opened.error} onRetry={opened.reload} /> : <Loader />
  }

  const reservation = doc.reservation
  const type = doc.document_type_label ?? DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type
  const decision = deliberationDecision(doc)
  const link = documentLink(doc, can)
  const period = documentPeriod(doc)
  const openable = canOpenInBrowser(doc.mime_type)
  const unavailable = doc.is_available === false

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{isPlanningExport(doc) ? 'Export du planning' : type}</Badge>
        {decision && <Badge tone={decision.tone}>{decision.label}</Badge>}
        {doc.version > 1 && <Badge tone="info">Version {doc.version}</Badge>}
        {doc.is_official && <Badge tone="success">Officiel</Badge>}
        {unavailable && <Badge tone="danger">Fichier indisponible</Badge>}
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {openable && (
            <Button variant="secondary" onClick={file.open} loading={file.busy === 'open'} disabled={file.busy !== null || unavailable}>
              <ExternalLink className="size-4" aria-hidden="true" /> Ouvrir
            </Button>
          )}
          <Button variant="secondary" onClick={file.download} loading={file.busy === 'download'} disabled={file.busy !== null || unavailable}>
            <Download className="size-4" aria-hidden="true" /> Télécharger
          </Button>
        </div>
        {file.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {file.error}
          </p>
        )}
        {link && (
          <Link to={link.to} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-link hover:underline">
            {link.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {wide && doc.mime_type === 'application/pdf' && !unavailable && <DocumentPreview doc={doc} />}

      <DetailList
        items={[
          doc.service_date && !period && ['Jour de service', formatDate(doc.service_date, LONG_DAY)],
          period && ['Période', formatDayRange(period)],
          doc.vehicle && ['Véhicule', doc.vehicle.licence_plate],
          reservation && [
            'Réservation',
            `n° ${reservation.id} · ${reservation.trip_purpose} · ${formatDate(reservation.trip_date, LONG_DAY)}`,
          ],
          ['Créé le', formatDateTime(doc.generated_at ?? doc.created_at)],
          doc.user?.full_name && ['Auteur', doc.user.full_name],
          ['Fichier', <span key="name" className="break-all">{doc.file_name}</span>],
          ['Taille', formatFileSize(doc.file_size)],
          ['Version', doc.version],
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
