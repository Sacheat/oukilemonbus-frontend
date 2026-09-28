// Préférence de thème : 'system' (suit l'OS), 'light' ou 'dark'.
// Le script inline de index.html applique le thème avant le premier rendu,
// avec la même clé de stockage.
const STORAGE_KEY = 'oukilemonbus-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set()

function readPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

let preference = readPreference()

function apply() {
  const dark = preference === 'dark' || (preference === 'system' && media.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

media.addEventListener('change', () => {
  if (preference === 'system') apply()
})

export function getThemePreference() {
  return preference
}

export function setThemePreference(value) {
  preference = value
  try {
    if (value === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Stockage indisponible (navigation privée…) : le choix vaut pour la session
  }
  apply()
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
