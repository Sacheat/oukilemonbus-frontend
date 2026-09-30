// Charge toutes les pages d'une liste paginée (boucle jusqu'à meta.last_page) et renvoie les éléments.
// Réservé aux listes de taille raisonnable ; au plus `maxPages` requêtes (10 par défaut, soit 150 éléments).
const DEFAULT_MAX_PAGES = 10

export async function fetchAllPages(getPage, { signal, maxPages = DEFAULT_MAX_PAGES } = {}) {
  const allItems = []
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await getPage(page, { signal })
    allItems.push(...result.data)
    if (page >= result.meta.last_page) break
  }
  return allItems
}
