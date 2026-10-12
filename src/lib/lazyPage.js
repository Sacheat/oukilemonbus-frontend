import { lazy } from 'react'

// Page chargée à la demande : son code n'est téléchargé que la première fois qu'on l'ouvre (un fichier par page
// au build), au lieu d'être dans le fichier de départ de l'application. `name` : export nommé de la page.
// Pendant ce premier téléchargement, le layout affiche son Loader (Suspense) ; ensuite, la page est gardée en mémoire.
export function lazyPage(load, name) {
  return lazy(() => load().then((module) => ({ default: module[name] })))
}
