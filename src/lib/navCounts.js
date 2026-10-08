import { getDriverAlerts } from '../api/driverAlerts'
import { getRequests } from '../api/requests'
import { getReservations } from '../api/reservations'
import { fetchPendingCount } from './queue'
import { REQUEST_QUEUES } from './requests'

// Compteurs de la barre latérale de l'espace gestion, par clé `badge` d'une entrée du menu (navigation.js).
// Chacun reprend le chiffre de la page visée (un meta.total, une seule ligne demandée) et n'est chargé qu'avec la
// permission de cette page. `sr` : fin de phrase pour les lecteurs d'écran ; `urgent` : badge rouge.
// Une réservation qui attend le Collège compte aussi dans « Réservations » : deux actions sur deux pages
// (encoder la décision, puis approuver) ; les chiffres ne s'additionnent pas.
export const NAV_COUNTS = {
  // Réservations « À traiter » (en attente ou en conflit, à venir) : même chiffre que la file
  queue: { permission: 'reservations.approve', sr: 'à traiter', fetch: fetchPendingCount },
  // Réservations qui attendent le Collège : même chiffre que l'onglet « À décider »
  college: {
    permission: 'council-decisions.create',
    sr: 'à décider',
    fetch: async ({ signal } = {}) => (await getReservations({ council: 'a_decider', per_page: 1 }, { signal })).meta.total,
  },
  // Adhésions et créations d'organisation en attente : total des pastilles de la page Demandes
  requests: {
    permission: 'org-registration-requests.review',
    sr: 'à examiner',
    fetch: async ({ signal } = {}) => {
      const pages = await Promise.all(
        REQUEST_QUEUES.map((queue) => getRequests(queue.kind, { statuses: ['en_attente'], per_page: 1 }, { signal })),
      )
      return pages.reduce((total, page) => total + page.meta.total, 0)
    },
  },
  // Demandes d'aide en cours (ouvertes ou prises en charge) : urgent
  alerts: {
    permission: 'driver-alerts.manage',
    sr: 'en cours',
    urgent: true,
    fetch: async ({ signal } = {}) =>
      (await getDriverAlerts({ statuses: ['ouverte', 'prise_en_charge'], per_page: 1 }, { signal })).meta.total,
  },
}

// Clés des compteurs que l'utilisateur peut voir
export function activeNavCounts(can) {
  return Object.keys(NAV_COUNTS).filter((key) => can(NAV_COUNTS[key].permission))
}

// Tous les compteurs permis, en parallèle : { queue: 4, college: 2, … }. Un compteur en erreur est simplement absent
// (indicatif : une erreur passagère ne doit rien casser).
export async function fetchNavCounts(keys) {
  const results = await Promise.allSettled(keys.map((key) => NAV_COUNTS[key].fetch()))
  return Object.fromEntries(
    keys.flatMap((key, index) => (results[index].status === 'fulfilled' ? [[key, results[index].value]] : [])),
  )
}
