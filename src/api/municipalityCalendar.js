import { api } from './client'

// Calendrier de la commune pour une année : { data: périodes, meta: { year, public_holidays: [{ date, label }] } }.
// Une période : { id, kind: 'fermeture' | 'vacances_scolaires', kind_label, label, start_date, end_date }.
// Les jours fériés légaux sont calculés par le backend (lecture seule).
export async function getCalendarPeriods(municipalityId, year, { signal } = {}) {
  const { data } = await api.get(`/municipalities/${municipalityId}/calendar-periods`, { params: { year }, signal })
  return data
}

export async function createCalendarPeriod(municipalityId, { kind, label, start_date, end_date }) {
  const { data } = await api.post(`/municipalities/${municipalityId}/calendar-periods`, { kind, label, start_date, end_date })
  return data.data
}

export async function updateCalendarPeriod(periodId, changes) {
  const { data } = await api.patch(`/municipality-calendar-periods/${periodId}`, changes)
  return data.data
}

export async function deleteCalendarPeriod(periodId) {
  await api.delete(`/municipality-calendar-periods/${periodId}`)
}
