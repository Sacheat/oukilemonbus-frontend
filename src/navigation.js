import {
  Building2,
  Bus,
  CalendarDays,
  CalendarOff,
  FileText,
  Gavel,
  House,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Plus,
  Repeat,
  Route,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'

import { recurrenceOrganizations } from './lib/recurrences'

// Menus de chaque espace. Un lien n'est affiché que si l'utilisateur a la
// `permission` indiquée (et que `visible(auth)` renvoie vrai, le cas échéant).

export const USER_NAV = [
  { to: '/espace', end: true, label: 'Accueil', icon: House },
  { to: '/espace/deplacements', label: 'Mes déplacements', icon: Route, permission: 'reservations.view' },
  { to: '/espace/reservations/nouvelle', label: 'Nouvelle réservation', icon: Plus, permission: 'reservations.create' },
  {
    to: '/espace/recurrences',
    label: 'Récurrences',
    icon: Repeat,
    permission: 'reservations.view',
    // Réservées aux écoles et au personnel communal
    visible: ({ user }) => recurrenceOrganizations(user).length > 0,
  },
  { to: '/espace/organisations', label: 'Mes organisations', icon: Building2, permission: 'organizations.view' },
  { to: '/espace/documents', label: 'Documents', icon: FileText, permission: 'documents.view' },
]

export const DRIVER_NAV = [
  { to: '/chauffeur', end: true, label: 'Mes missions', icon: Bus },
  { to: '/chauffeur/feuilles-de-route', label: 'Feuilles de route', icon: FileText, permission: 'documents.view' },
  { to: '/chauffeur/indisponibilites', label: 'Indisponibilités', icon: CalendarOff, permission: 'unavailabilities.view' },
]

// Back-office agent et admin, groupé par sections dans la barre latérale
export const BACKOFFICE_NAV = [
  {
    title: 'Gestion',
    items: [
      { to: '/gestion', end: true, label: 'Tableau de bord', icon: LayoutDashboard, permission: 'dashboard.view' },
      { to: '/gestion/reservations', label: 'Réservations', icon: ListChecks, permission: 'reservations.approve', badge: 'queue' },
      { to: '/gestion/planning', label: 'Planning', icon: CalendarDays, permission: 'reservations.view' },
      { to: '/gestion/college', label: 'Décisions du Collège', icon: Gavel, permission: 'council-decisions.create' },
      { to: '/gestion/demandes', label: 'Demandes', icon: Inbox, permission: 'org-registration-requests.review' },
      { to: '/gestion/organisations', label: 'Organisations', icon: Building2, permission: 'organizations.update' },
      { to: '/gestion/documents', label: 'Documents', icon: FileText, permission: 'documents.generate' },
    ],
  },
  {
    title: 'Flotte',
    items: [
      { to: '/gestion/vehicules', label: 'Véhicules', icon: Bus, permission: 'vehicles.update' },
      { to: '/gestion/chauffeurs', label: 'Chauffeurs', icon: Users, permission: 'drivers.update' },
      { to: '/gestion/indisponibilites', label: 'Indisponibilités', icon: CalendarOff, permission: 'unavailabilities.create' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/gestion/utilisateurs', label: 'Utilisateurs', icon: UserCog, permission: 'users.manage-roles' },
      { to: '/gestion/outils', label: 'Outils', icon: Wrench, permission: 'tooling.access' },
      { to: '/gestion/communes', label: 'Communes', icon: MapPinned, permission: 'municipalities.manage' },
    ],
  },
]

export function isNavItemVisible(item, auth) {
  if (item.permission && !auth.can(item.permission)) return false
  if (item.visible && !item.visible(auth)) return false
  return true
}
