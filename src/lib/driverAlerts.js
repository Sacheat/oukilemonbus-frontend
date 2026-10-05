// Demandes d'aide des chauffeurs, côté agent (/gestion/alertes)

// Filtres de la liste (?statut=) : en cours par défaut (ouvertes et prises en charge), clôturées, toutes
export const ALERT_FILTERS = [
  { value: 'en-cours', label: 'En cours', statuses: ['ouverte', 'prise_en_charge'] },
  { value: 'cloturees', label: 'Clôturées', statuses: ['cloturee'] },
  { value: 'toutes', label: 'Toutes', statuses: [] },
]
export const DEFAULT_ALERT_FILTER = 'en-cours'

export function readAlertSearch(searchParams) {
  const filter = ALERT_FILTERS.find((option) => option.value === searchParams.get('statut')) ?? ALERT_FILTERS[0]
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  return { filter: filter.value, statuses: filter.statuses, page }
}

// Ton de la pastille du statut
export const ALERT_STATUS_TONES = { ouverte: 'danger', prise_en_charge: 'warning', cloturee: 'neutral' }

// Lieu de l'alerte en une ligne : précision de la position, ou dernier lieu connu
export function alertPlaceText(alert) {
  if (alert.position.latitude != null) {
    return alert.position.accuracy_m ? `Position envoyée, à ${alert.position.accuracy_m} m près` : 'Position envoyée'
  }
  return alert.fallback_location
    ? `${alert.position.state_label} · dernier lieu connu : ${alert.fallback_location.label}`
    : alert.position.state_label
}

// Lien téléphone (sans espaces)
export function telHref(phone) {
  return `tel:${String(phone).replace(/\s+/g, '')}`
}
