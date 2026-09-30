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
