import { FileCheck2, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { deleteRequestProof, uploadRequestProof } from '../../api/organizations'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { PROOF_ACCEPT, proofFileError } from '../../lib/organizations'
import { Button } from '../ui/Button'

// Justificatif d'une demande en attente : ajouter, remplacer ou supprimer.
// `kind` : 'adhesion' ou 'creation' ; `onChanged()` recharge la liste après une modification.
export function ProofControls({ kind, requestId, hasProof, onChanged }) {
  const inputRef = useRef(null)
  const errorId = useId()
  const [busy, setBusy] = useState(null) // 'upload' | 'delete'
  const [error, setError] = useState(null)

  async function run(action, work) {
    setBusy(action)
    setError(null)
    try {
      await work()
      await onChanged()
    } catch (err) {
      setError(getFieldErrors(err).proof_document ?? getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  function handleFile(event) {
    const file = event.target.files[0]
    event.target.value = '' // permet de choisir à nouveau le même fichier
    if (!file) return
    const invalid = proofFileError(file)
    if (invalid) {
      setError(invalid)
      return
    }
    run('upload', () => uploadRequestProof(kind, requestId, file))
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {hasProof ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-success">
            <FileCheck2 className="size-4" aria-hidden="true" /> Justificatif joint
          </span>
        ) : (
          <span className="text-muted">Aucun justificatif</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={PROOF_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
        />
        <Button
          variant="secondary"
          className="text-sm"
          onClick={() => inputRef.current.click()}
          loading={busy === 'upload'}
          disabled={busy !== null}
          aria-describedby={error ? errorId : undefined}
        >
          <Upload className="size-4" aria-hidden="true" /> {hasProof ? 'Remplacer' : 'Ajouter un justificatif'}
        </Button>
        {hasProof && (
          <Button
            variant="secondary"
            className="text-sm"
            onClick={() => run('delete', () => deleteRequestProof(kind, requestId))}
            loading={busy === 'delete'}
            disabled={busy !== null}
          >
            <Trash2 className="size-4" aria-hidden="true" /> Supprimer
          </Button>
        )}
      </div>
      <p className="text-xs text-muted">PDF, JPG ou PNG, 5 Mo maximum.</p>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-semibold whitespace-pre-line text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
