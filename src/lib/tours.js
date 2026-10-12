import {
  BellRing,
  Building2,
  Bus,
  CalendarDays,
  CalendarOff,
  ClipboardCheck,
  FileText,
  Gavel,
  Inbox,
  Keyboard,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Plus,
  Route,
  UserCog,
} from 'lucide-react'

// Tutoriels de première connexion, un par espace (clés de `tours_seen` renvoyé par /auth/me).
// Chaque tutoriel a des cartes (WelcomeTour, montrées à tous) et, en option, une visite sur les vrais éléments de
// l'interface (SpotlightTour) : `target` = valeur de l'attribut `data-tour` visé. Une carte ou une étape avec
// `permission` n'est montrée qu'à qui l'a, et seulement si `visible(auth)` renvoie vrai, le cas échéant (comme les
// menus de navigation.js) ; une étape dont la cible est absente ou cachée est sautée.
// Nouvelle page ou entrée de menu : ajouter sa carte ou son étape au tutoriel de l'espace.

export const TOURS = {
  usager: {
    home: '/espace',
    label: 'Espace usager',
    cards: [
      {
        icon: Bus,
        title: 'Bienvenue sur OuKiLéMonBus',
        text: 'Ici, vous demandez le bus communal pour les sorties de votre organisation et vous suivez vos demandes jusqu’au départ.',
      },
      {
        icon: Building2,
        title: 'D’abord, votre organisation',
        text: 'On réserve toujours au nom d’une organisation (école, CPAS, ASBL…). Rejoignez la vôtre ou demandez sa création depuis « Mes organisations » : un agent communal valide la demande.',
        permission: 'organizations.view',
        // Inutile pour qui fait déjà partie d'une organisation
        visible: ({ user }) => !user?.organizations?.length,
      },
      {
        icon: Plus,
        title: 'Réserver en quelques étapes',
        text: 'L’assistant vérifie votre trajet en direct, puis annonce ce que deviendra la demande. Réservez au moins 15 jours à l’avance.',
        permission: 'reservations.create',
      },
      {
        icon: Route,
        title: 'Suivre vos déplacements',
        text: 'Chaque demande avance par étapes : en attente, approuvée, puis confirmée quand le chauffeur et le bus sont affectés. Certaines organisations attendent d’abord une décision du Collège.',
        permission: 'reservations.view',
      },
      {
        icon: ClipboardCheck,
        title: 'Confirmer les passagers',
        text: 'Dans les deux semaines qui précèdent le trajet, confirmez le nombre de passagers. L’accueil vous le rappelle dans « À faire ».',
        permission: 'reservations.view',
      },
      {
        icon: BellRing,
        title: 'Restez informé',
        text: 'Chaque changement vous est signalé par la cloche et par email. Choisissez ce que vous recevez dans « Mon compte ».',
      },
    ],
    spots: [
      { target: 'chiffres', title: 'En un coup d’œil', text: 'Vos trajets confirmés, vos demandes en attente et vos conflits. Cliquez sur un chiffre pour voir la liste.' },
      { target: 'menu', title: 'Le menu', text: 'Toutes les pages de votre espace sont ici.' },
      { target: 'nav:/espace/deplacements', title: 'Mes déplacements', text: 'Toutes vos demandes, à venir et passées, avec leur détail.' },
      { target: 'nav:/espace/reservations/nouvelle', title: 'Nouvelle réservation', text: 'L’assistant de réservation.' },
      { target: 'nav:/espace/organisations', title: 'Mes organisations', text: 'Rejoindre une organisation, demander sa création, gérer ses membres si vous en êtes responsable.' },
      { target: 'notifications', title: 'Notifications', text: 'Les dernières nouvelles de vos demandes.' },
      { target: 'compte', title: 'Mon compte', text: 'Vos coordonnées, votre mot de passe, vos notifications, et ce tutoriel à revoir.' },
    ],
  },

  agent: {
    home: '/gestion',
    label: 'Gestion',
    cards: [
      {
        icon: LayoutDashboard,
        title: 'Bienvenue dans la gestion',
        text: 'Le tableau de bord résume la journée : ce qui attend une action de votre part (« À faire ») et ce qui mérite un œil (« À surveiller »).',
      },
      {
        icon: ListChecks,
        title: 'La file des réservations',
        text: 'Approuvez, refusez, affectez un chauffeur et un bus, puis confirmez. Le panneau de chaque réservation indique la prochaine étape et explique les conflits.',
        permission: 'reservations.approve',
      },
      {
        icon: Keyboard,
        title: 'Plus vite au clavier',
        text: 'Dans la file, J et K passent d’une réservation à l’autre, A approuve, E affecte. Appuyez sur ? pour voir tous les raccourcis.',
        permission: 'reservations.approve',
      },
      {
        icon: Gavel,
        title: 'Les décisions du Collège',
        text: 'Pour les CPAS, ASBL et organisations externes, encodez la décision du Collège avant d’approuver. La délibération est générée et le demandeur prévenu.',
        permission: 'council-decisions.create',
      },
      {
        icon: CalendarDays,
        title: 'Le planning',
        text: 'Les trajets de la semaine, bus par bus, avec les disponibilités et l’avancement réel signalé par les chauffeurs. Exportable en Excel.',
        permission: 'reservations.view',
      },
      {
        icon: Inbox,
        title: 'Les demandes des usagers',
        text: 'Adhésions à une organisation et créations d’organisations, avec une note de confiance pour vous aider à décider.',
        permission: 'org-registration-requests.review',
      },
      {
        icon: LifeBuoy,
        title: 'Les demandes d’aide',
        text: 'Un chauffeur en difficulté appuie sur « Aide » : vous êtes prévenu tout de suite, en urgence. Prenez-la en charge depuis « Demandes d’aide ».',
        permission: 'driver-alerts.manage',
      },
      {
        icon: UserCog,
        title: 'Administration',
        text: 'En tant qu’admin, vous gérez aussi les comptes et leurs rôles, les règles de la commune et les outils de diagnostic.',
        permission: 'users.manage-roles',
      },
    ],
    spots: [
      { target: 'a-faire', title: 'À faire', text: 'Seulement ce qui attend votre action. Chaque tuile ouvre la liste concernée.' },
      { target: 'menu', title: 'Le menu', text: 'Toutes les pages de la gestion sont ici.' },
      { target: 'nav:/gestion/reservations', title: 'Réservations', text: 'La file : le nombre à côté indique les réservations à traiter.' },
      { target: 'nav:/gestion/planning', title: 'Planning', text: 'La semaine bus par bus.' },
      { target: 'nav:/gestion/college', title: 'Décisions du Collège', text: 'Les réservations qui attendent une décision.' },
      { target: 'nav:/gestion/demandes', title: 'Demandes', text: 'Adhésions et nouvelles organisations à examiner.' },
      { target: 'nav:/gestion/vehicules', title: 'Flotte', text: 'Véhicules, chauffeurs et leurs indisponibilités.' },
      { target: 'nav:/gestion/alertes', title: 'Demandes d’aide', text: 'En rouge quand un chauffeur attend une réponse.' },
      { target: 'nav:/gestion/utilisateurs', title: 'Utilisateurs', text: 'Comptes, rôles, liens de mot de passe.', permission: 'users.manage-roles' },
      { target: 'nav:/gestion/communes', title: 'Communes', text: 'Règles de la commune, dépôt, contact de garde, envoi du planning.', permission: 'municipalities.manage' },
      { target: 'nav:/gestion/outils', title: 'Outils', text: 'Santé du système, journal des actions, jobs en échec.', permission: 'tooling.access' },
      { target: 'notifications', title: 'Notifications', text: 'Nouvelles demandes, conflits, comptes rendus « non réalisé »…' },
      { target: 'compte', title: 'Mon compte', text: 'Vos coordonnées, vos notifications, et ce tutoriel à revoir.' },
    ],
  },

  chauffeur: {
    home: '/chauffeur',
    label: 'Espace chauffeur',
    cards: [
      {
        icon: Bus,
        title: 'Bienvenue dans votre espace',
        text: '« Mes missions » liste vos trajets : ceux du jour en premier, puis les prochains jours. Touchez une mission pour voir le détail et l’itinéraire.',
      },
      {
        icon: CalendarDays,
        title: 'Ma journée',
        text: 'Le jour du trajet, appuyez sur Départ puis Arrivée, à l’aller et au retour. Chaque appui est confirmé ; une erreur s’annule pendant 2 minutes.',
        permission: 'trip-progress.record',
      },
      {
        icon: LifeBuoy,
        title: 'Besoin d’aide ?',
        text: 'Le bouton « Aide » prévient tout de suite les agents, avec votre position. Le contact de garde est affiché si vous devez appeler.',
        permission: 'trip-progress.record',
      },
      {
        icon: ClipboardCheck,
        title: 'Le compte rendu',
        text: 'Après le trajet, indiquez s’il a été réalisé, les heures réelles et le nombre de passagers. Vous avez jusqu’au lendemain 12:00.',
        permission: 'trip-reports.submit',
      },
      {
        icon: FileText,
        title: 'Feuilles de route',
        text: 'Imprimez la feuille de votre semaine, à remplir à la main en secours, et consultez les feuilles officielles du véhicule.',
        permission: 'documents.view',
      },
      {
        icon: CalendarOff,
        title: 'Vos indisponibilités',
        text: 'Vos congés et absences encodés par un agent. Pour en signaler une, contactez le service.',
        permission: 'unavailabilities.view',
      },
    ],
    // Espace pensé pour le téléphone : cartes seules (décidé le 12/10)
    spots: [],
  },
}

// Icône de chaque tutoriel, pour la section de /compte
export const TOUR_ICONS = { usager: Route, agent: LayoutDashboard, chauffeur: Bus }

export function isTourSeen(user, tour) {
  return Boolean(user?.tours_seen?.[tour])
}

// `auth` : valeur de useAuth()
function allowed(item, auth) {
  if (item.permission && !auth.can(item.permission)) return false
  if (item.visible && !item.visible(auth)) return false
  return true
}

export function tourCards(tour, auth) {
  return TOURS[tour].cards.filter((card) => allowed(card, auth))
}

export function tourSpots(tour, auth) {
  return TOURS[tour].spots.filter((spot) => allowed(spot, auth))
}

// Élément visé par une étape, s'il est affiché (pas display:none, pas de taille nulle)
export function findTarget(target) {
  const element = document.querySelector(`[data-tour="${CSS.escape(target)}"]`)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 ? element : null
}

// Étapes de la visite dont la cible est affichée maintenant ; aucune sous 640 px (cartes seules sur téléphone)
export function visibleSpots(tour, auth) {
  if (!window.matchMedia(SPOTLIGHT_MEDIA).matches) return []
  return tourSpots(tour, auth).filter((spot) => findTarget(spot.target))
}

const SPOTLIGHT_MEDIA = '(min-width: 640px)'

// La visite n'est proposée que si elle montre assez d'éléments pour valoir le détour
export const MIN_VISIBLE_SPOTS = 3

// Tutoriels de l'utilisateur (« Revoir le tutoriel » dans /compte), selon ses rôles
export function userTours(hasRole) {
  const tours = []
  if (hasRole('user')) tours.push('usager')
  if (hasRole('admin', 'agent_communal')) tours.push('agent')
  if (hasRole('chauffeur')) tours.push('chauffeur')
  return tours
}
