import { useId, useState } from 'react'
import { downloadDocument } from '../api/documents'
import { getBlobErrorMessage, saveBlob, showBlobIn } from '../lib/documents'

// Ouvrir (nouvel onglet) et télécharger le fichier d'un document, avec l'état occupé et l'erreur :
// { busy: null | 'open' | 'download', error, errorId, open, download }
export function useDocumentFile(doc) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const errorId = useId()

  async function open() {
    // Onglet ouvert pendant le clic, rempli quand le fichier est arrivé (sinon bloqué comme popup)
    const tab = window.open('', '_blank')
    setBusy('open')
    setError(null)
    try {
      const blob = await downloadDocument(doc.id)
      if (tab) showBlobIn(tab, blob)
      else saveBlob(blob, doc.file_name)
    } catch (err) {
      tab?.close()
      setError(await getBlobErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function download() {
    setBusy('download')
    setError(null)
    try {
      saveBlob(await downloadDocument(doc.id), doc.file_name)
    } catch (err) {
      setError(await getBlobErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return { busy, error, errorId, open, download }
}
