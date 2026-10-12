import { useCallback } from 'react'
import { getDocumentsPage } from '../api/documents'
import { ADMIN_DOCUMENT_TYPES } from '../lib/documentsAdmin'
import { useApi } from './useApi'

// Page de documents pour une clé texte (JSON des paramètres de GET /documents : type, recherche, période, page).
// Rechargement seulement quand la clé change.
export function useDocuments(requestKey) {
  const fetchDocuments = useCallback((signal) => getDocumentsPage(JSON.parse(requestKey), { signal }), [requestKey])
  return useApi(fetchDocuments)
}

// Nombre de documents par type pour les pastilles, avec la même recherche et la même période que la liste.
// `countKey` : JSON des paramètres sans type ni page. Un appel par type plus un pour « Tous » (meta.total, en
// parallèle) ; renvoie useApi ({ data: { all, deliberation, feuille_route, … } }).
// `types` : types des pastilles (ceux de /gestion par défaut), tableau stable (constante de module).
export function useDocumentCounts(countKey, types = ADMIN_DOCUMENT_TYPES) {
  const fetchCounts = useCallback(
    async (signal) => {
      const params = JSON.parse(countKey)
      const chipTypes = [null, ...types]
      const pages = await Promise.all(
        chipTypes.map((type) =>
          getDocumentsPage({ ...params, page: 1, per_page: 1, document_type: type ? [type] : types }, { signal }),
        ),
      )
      return Object.fromEntries(chipTypes.map((type, index) => [type ?? 'all', pages[index].meta?.total ?? null]))
    },
    [countKey, types],
  )
  return useApi(fetchCounts)
}
