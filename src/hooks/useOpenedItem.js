import { useCallback } from 'react'
import { useApi } from './useApi'

function resolveNull() {
  return Promise.resolve(null)
}

// Élément ouvert dans le panneau d'une page de liste (?chauffeur=id, ?vehicule=id) : pris dans la page chargée,
// sinon relu par `fetchOne(id, { signal })` (lien vers un élément d'une autre page, ex. depuis le tableau de bord).
// `list` : undefined tant que la liste n'est pas reçue ; `param` : valeur de l'URL ; `fetchOne` : fonction stable.
// Renvoie { item, loading, error } : item undefined pendant le chargement ou si l'élément est introuvable.
export function useOpenedItem(list, param, fetchOne) {
  const fromList = list?.find((item) => String(item.id) === param)
  const mustFetch = Boolean(list) && !fromList && /^\d+$/.test(param ?? '')
  const fetcher = useCallback(
    (signal) => (mustFetch ? fetchOne(param, { signal }) : resolveNull()),
    [mustFetch, param, fetchOne],
  )
  const fetched = useApi(fetcher)

  if (fromList) return { item: fromList, loading: false, error: null }
  if (!list) return { item: undefined, loading: true, error: null }
  if (!mustFetch) return { item: undefined, loading: false, error: null }
  const item = fetched.data && String(fetched.data.id) === param ? fetched.data : undefined
  return { item, loading: fetched.loading && !item, error: fetched.loading ? null : fetched.error }
}
