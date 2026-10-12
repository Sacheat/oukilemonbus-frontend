import axios from 'axios'
import { useEffect, useState } from 'react'
import { downloadDocument } from '../../../api/documents'
import { getBlobErrorMessage } from '../../../lib/documents'
import { Loader } from '../../ui/Loader'

// Aperçu d'un PDF dans le panneau (grand écran) : fichier lu avec la session, affiché par le lecteur du navigateur
// dans une iframe sur l'URL du Blob, libérée quand le document change ou que le panneau se ferme.
export function DocumentPreview({ doc }) {
  const [preview, setPreview] = useState({ id: null, url: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let url = null
    downloadDocument(doc.id, { signal: controller.signal })
      .then((blob) => {
        url = URL.createObjectURL(blob)
        setPreview({ id: doc.id, url, error: null })
      })
      .catch(async (error) => {
        if (axios.isCancel(error)) return
        setPreview({ id: doc.id, url: null, error: await getBlobErrorMessage(error) })
      })
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [doc.id])

  if (preview.id !== doc.id) return <Loader />
  if (preview.error) return <p className="text-sm text-muted">Aperçu indisponible : {preview.error}</p>
  return (
    <iframe
      src={preview.url}
      title={`Aperçu de ${doc.file_name}`}
      className="h-[70vh] w-full rounded-card border border-line bg-surface"
    />
  )
}
