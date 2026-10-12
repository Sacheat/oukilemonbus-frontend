// Charge toutes les pages d'une liste paginée (boucle jusqu'à meta.last_page) et renvoie les éléments.
// Réservé aux listes de taille raisonnable ; au plus `maxPages` requêtes (10 par défaut, soit 150 éléments).
const DEFAULT_MAX_PAGES = 10

export async function fetchAllPages(getPage, options = {}) {
  return (await fetchPages(getPage, options)).items
}

// Comme fetchAllPages, en disant si la liste est complète : `complete` vaut false quand la limite de `maxPages` a
// coupé la liste. La page peut alors l'annoncer au lieu de cacher les derniers éléments sans rien dire.
export async function fetchPages(getPage, { signal, maxPages = DEFAULT_MAX_PAGES } = {}) {
  const items = []
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await getPage(page, { signal })
    items.push(...result.data)
    if (page >= result.meta.last_page) return { items, complete: true }
  }
  return { items, complete: false }
}
