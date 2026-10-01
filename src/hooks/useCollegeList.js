import { useCallback } from 'react'
import { getCouncilDecisions } from '../api/documents'
import { getReservations } from '../api/reservations'
import { TAB_DECISION_STATUS } from '../lib/councilDecisions'
import { useApi } from './useApi'

// Liste d'un onglet de la page Collège, paginée par 15, filtrée par le backend :
//   « À décider »            → GET /reservations?council=a_decider (trajet le plus proche d'abord)
//   « Approuvées / Refusées » → GET /council-decisions?decision_status=…
// `tab` et `page` sont des valeurs simples : rechargement seulement quand l'une change.
// Pendant un chargement, `data` vaut undefined : useApi garderait sinon la liste de l'onglet précédent
// (des réservations affichées comme des décisions, ou l'inverse).
export function useCollegeList(tab, page) {
  const fetchList = useCallback(
    (signal) =>
      tab === 'a-decider'
        ? getReservations({ council: 'a_decider', sort: 'asc', page }, { signal })
        : getCouncilDecisions({ decision_status: TAB_DECISION_STATUS[tab], page }, { signal }),
    [tab, page],
  )
  const list = useApi(fetchList)
  return { ...list, data: list.loading ? undefined : list.data }
}
