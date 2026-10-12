import { Upload, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { deletePassengerList, getPassengerList, uploadPassengerList } from '../../api/passengerLists'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../lib/dates'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { ConfirmModal } from '../tooling/ConfirmModal'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field, FileInput } from '../ui/Field'
import { Loader } from '../ui/Loader'
import { Panel } from '../ui/Panel'
import { DocumentRow } from './DocumentRow'

const ACCEPT = '.pdf,.xlsx,.csv,.jpg,.jpeg,.png'

// Texte d'introduction selon qui regarde
const INTRO = {
  user: 'Le SPF Mobilité peut demander au chauffeur la liste nominative des passagers. Joignez-la ici (PDF, Excel, CSV ou photo) : vous pouvez la remplacer jusqu’au départ.',
  agent: 'Liste nominative jointe par le demandeur, à montrer en cas de contrôle du SPF Mobilité. Vous pouvez la joindre ou la remplacer à tout moment.',
  driver: 'Liste nominative des passagers, à montrer en cas de contrôle du SPF Mobilité.',
}

// Liste des passagers d'une réservation (carnet de bord) : le fichier joint (Ouvrir, Télécharger), puis, si le
// backend le permet (`meta.can_replace`), joindre, remplacer ou retirer. `audience` : user | agent | driver.
// Gardée 3 ans après l'année du trajet, puis supprimée automatiquement.
export function PassengerListCard({ reservationId, audience = 'user' }) {
  const fetchList = useCallback((signal) => getPassengerList(reservationId, { signal }), [reservationId])
  const list = useApi(fetchList)
  const [file, setFile] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const document = list.data?.data ?? null
  const meta = list.data?.meta ?? {}

  function finish(message) {
    setFile(null)
    setInputKey((key) => key + 1)
    setError(null)
    setNotice(message)
    list.reload()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!file) return
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      await uploadPassengerList(reservationId, file)
      finish(document ? 'Liste des passagers remplacée.' : 'Liste des passagers jointe.')
    } catch (err) {
      setError(getFieldErrors(err).passenger_list ?? getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel title="Liste des passagers">
      <div className="grid gap-4 p-5">
        <p className="flex gap-2 text-sm text-muted">
          <Users className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {INTRO[audience] ?? INTRO.user}
        </p>
        {notice && <Alert tone="success">{notice}</Alert>}

        {list.error ? (
          <Alert tone="danger">{getErrorMessage(list.error)}</Alert>
        ) : !list.data ? (
          <Loader />
        ) : (
          <>
            {document ? (
              <ul className="-mx-5 border-y border-line">
                <DocumentRow document={document} showReservation={false} />
              </ul>
            ) : (
              <p className="text-sm font-semibold">Aucune liste jointe pour l’instant.</p>
            )}

            {meta.can_replace ? (
              <form onSubmit={handleSubmit} noValidate className="grid gap-3">
                <Field
                  label={document ? 'Remplacer par un autre fichier' : 'Joindre la liste'}
                  hint={`PDF, Excel (.xlsx), CSV, JPG ou PNG, 5 Mo au plus.${meta.closes_at ? ` Modifiable jusqu’au départ (${formatDateTime(meta.closes_at)}).` : ''}`}
                  error={error}
                >
                  {(props) => (
                    <FileInput key={inputKey} {...props} accept={ACCEPT} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                  )}
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" loading={sending} disabled={!file}>
                    <Upload className="size-4" aria-hidden="true" />
                    {document ? 'Remplacer la liste' : 'Joindre la liste'}
                  </Button>
                  {document && (
                    <Button type="button" variant="secondary" onClick={() => setConfirmRemove(true)}>
                      Retirer la liste
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              meta.reason && <p className="text-sm text-muted">{meta.reason}</p>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmRemove}
        title="Retirer la liste des passagers ?"
        confirmLabel="Retirer"
        danger
        action={() => deletePassengerList(reservationId)}
        onClose={() => setConfirmRemove(false)}
        onDone={() => {
          setConfirmRemove(false)
          finish('Liste des passagers retirée.')
        }}
      >
        <p>Le fichier sera supprimé. Le chauffeur n’aura plus de liste à montrer en cas de contrôle.</p>
      </ConfirmModal>
    </Panel>
  )
}
