import { api } from './client'

// Liste des passagers d'une réservation (carnet de bord) : { data: document | null, meta: { can_replace, closes_at, reason } }.
// Le fichier se télécharge comme tout document (downloadDocument / useDocumentFile).
export async function getPassengerList(reservationId, { signal } = {}) {
  const { data } = await api.get(`/reservations/${reservationId}/passenger-list`, { signal })
  return data
}

// Joint ou remplace la liste (multipart, champ `passenger_list`) → le document créé
export async function uploadPassengerList(reservationId, file) {
  const body = new FormData()
  body.append('passenger_list', file)
  const { data } = await api.post(`/reservations/${reservationId}/passenger-list`, body)
  return data.data
}

export async function deletePassengerList(reservationId) {
  await api.delete(`/reservations/${reservationId}/passenger-list`)
}
