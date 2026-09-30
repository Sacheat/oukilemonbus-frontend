// Charge toutes les pages d'une liste paginée (meta.current_page / meta.last_page) et renvoie les éléments.
// Réservé aux petites listes (comptes, chauffeurs) ; au plus MAX_PAGES requêtes.
const MAX_PAGES = 10

export async function fetchAllPages(getPage, { signal } = {}) {
  const allItems = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getPage(page, { signal })
    allItems.push(...result.data)
    if (page >= result.meta.last_page) break
  }
  return allItems
}
