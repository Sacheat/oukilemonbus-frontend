import { useCallback } from 'react'
import { getNotifications, getNotificationsSummary } from '../api/notifications'
import { useApi } from './useApi'

// Page de notifications pour une clé texte (JSON des paramètres de GET /notifications), relue quand la clé change
export function useNotificationsList(requestKey) {
  const fetchNotifications = useCallback((signal) => getNotifications(JSON.parse(requestKey), { signal }), [requestKey])
  return useApi(fetchNotifications)
}

// Totaux de GET /notifications/summary pour une clé texte (JSON des filtres)
export function useNotificationsSummary(countKey) {
  const fetchSummary = useCallback((signal) => getNotificationsSummary(JSON.parse(countKey), { signal }), [countKey])
  return useApi(fetchSummary)
}
