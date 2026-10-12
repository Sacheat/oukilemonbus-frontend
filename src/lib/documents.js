import axios from 'axios'
import { getErrorMessage } from './errors'

// 4605 → « 4,5 Ko »
export function formatFileSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} o`
  const units = ['Ko', 'Mo', 'Go']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toLocaleString('fr-BE', { maximumFractionDigits: 1 })} ${units[unit]}`
}

// Décision du Collège sur une réservation
export const DECISION_STATUS = {
  en_attente: { label: 'En attente', tone: 'warning' },
  approuve: { label: 'Approuvée', tone: 'success' },
  refuse: { label: 'Refusée', tone: 'danger' },
}

// Enregistre un fichier téléchargé sous son nom
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// Affiche un fichier dans un onglet ouvert au moment du clic (sinon le navigateur bloque la fenêtre)
export function showBlobIn(tab, blob) {
  const url = URL.createObjectURL(blob)
  tab.location.href = url
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// Erreur d'un téléchargement en blob : le corps JSON du backend arrive lui aussi en Blob
export async function getBlobErrorMessage(error) {
  const data = axios.isAxiosError(error) ? error.response?.data : null
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text())
      if (body?.message && error.response.status < 500) return body.message
    } catch {
      // corps illisible : message générique
    }
  }
  return getErrorMessage(error)
}

const SPREADSHEET_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

// Le navigateur sait afficher le fichier dans un onglet (PDF, image) ; sinon on ne propose que le téléchargement
export function canOpenInBrowser(mimeType = '') {
  return mimeType === 'application/pdf' || mimeType.startsWith('image/')
}

// Tuile du type de fichier : libellé court et couleurs (tokens de la DA)
export function fileKind(mimeType = '') {
  if (mimeType === 'application/pdf') return { label: 'PDF', colors: 'bg-danger-soft text-danger' }
  if (mimeType.startsWith('image/')) return { label: 'IMG', colors: 'bg-info-soft text-info' }
  if (SPREADSHEET_TYPES.includes(mimeType)) return { label: 'XLS', colors: 'bg-success-soft text-success' }
  return { label: 'DOC', colors: 'bg-neutral-soft text-neutral' }
}

// Documents groupés par mois de création (heure de Bruxelles), les plus récents d'abord :
// [{ key: '2026-06', label: 'juin 2026', items }]
export function groupByMonth(documents) {
  const groups = new Map()
  const sorted = [...documents].sort((a, b) =>
    (b.generated_at ?? b.created_at).localeCompare(a.generated_at ?? a.created_at),
  )
  for (const doc of sorted) {
    const date = new Date(doc.generated_at ?? doc.created_at)
    const key = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Europe/Brussels' }).format(date)
    if (!groups.has(key)) {
      const label = new Intl.DateTimeFormat('fr-BE', { month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' }).format(date)
      groups.set(key, { key, label, items: [] })
    }
    groups.get(key).items.push(doc)
  }
  return [...groups.values()]
}
