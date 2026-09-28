import { createBrowserRouter } from 'react-router'
import { RequireAuth, RequireGuest, RequirePermission, RequireRole, RootRedirect } from './auth/guards'
import { PublicLayout } from './layouts/PublicLayout'
import { SidebarLayout } from './layouts/SidebarLayout'
import { TopNavLayout } from './layouts/TopNavLayout'
import { BACKOFFICE_NAV, DRIVER_NAV, USER_NAV } from './navigation'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { LoginPage } from './pages/auth/LoginPage'
import { NotFoundPage } from './pages/errors/NotFoundPage'
import { RouteErrorPage } from './pages/errors/RouteErrorPage'
import { SpaceHomePage } from './pages/SpaceHomePage'

// Chemins en français, sauf /verify-email et /reset-password imposés par les liens
// des emails du backend. Les pages <ComingSoonPage> sont à remplacer par bloc.

function soon(path, eyebrow, title, permission) {
  const page = <ComingSoonPage eyebrow={eyebrow} title={title} />
  return { path, element: permission ? <RequirePermission permission={permission}>{page}</RequirePermission> : page }
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RootRedirect /> },

      {
        element: <RequireGuest />,
        children: [
          {
            element: <PublicLayout />,
            children: [{ path: 'connexion', element: <LoginPage /> }],
          },
        ],
      },

      {
        element: <RequireAuth />,
        children: [
          // Espace usager (membres et responsables d'organisations)
          {
            path: 'espace',
            element: <RequireRole roles={['user']} />,
            children: [
              {
                element: <TopNavLayout nav={USER_NAV} />,
                children: [
                  { index: true, element: <SpaceHomePage eyebrow="Espace demandeur" /> },
                  soon('deplacements', 'Suivi de vos demandes', 'Mes déplacements', 'reservations.view'),
                  soon('reservations/nouvelle', 'Nouvelle réservation', 'Commençons par votre trajet', 'reservations.create'),
                  soon('recurrences', 'Écoles et personnel communal', 'Récurrences', 'reservations.view'),
                  soon('organisations', 'Mon espace', 'Mes organisations', 'organizations.view'),
                  soon('documents', 'Mon espace', 'Documents', 'documents.view'),
                ],
              },
            ],
          },

          // Espace chauffeur
          {
            path: 'chauffeur',
            element: <RequireRole roles={['chauffeur']} />,
            children: [
              {
                element: <TopNavLayout nav={DRIVER_NAV} />,
                children: [
                  { index: true, element: <SpaceHomePage eyebrow="Espace chauffeur" /> },
                  soon('documents', 'Espace chauffeur', 'Feuilles de route', 'documents.view'),
                  soon('indisponibilites', 'Espace chauffeur', 'Mes indisponibilités', 'unavailabilities.view'),
                ],
              },
            ],
          },

          // Back-office agent communal et admin
          {
            path: 'gestion',
            element: <RequireRole roles={['admin', 'agent_communal']} />,
            children: [
              {
                element: <SidebarLayout sections={BACKOFFICE_NAV} />,
                children: [
                  { index: true, element: <SpaceHomePage eyebrow="Gestion" /> },
                  soon('reservations', 'Gestion', 'Réservations', 'reservations.approve'),
                  soon('planning', 'Gestion', 'Planning', 'reservations.view'),
                  soon('college', 'Gestion', 'Décisions du Collège', 'council-decisions.create'),
                  soon('demandes', 'Gestion', 'Demandes', 'org-registration-requests.review'),
                  soon('organisations', 'Gestion', 'Organisations', 'organizations.update'),
                  soon('documents', 'Gestion', 'Documents', 'documents.generate'),
                  soon('vehicules', 'Flotte', 'Véhicules', 'vehicles.update'),
                  soon('chauffeurs', 'Flotte', 'Chauffeurs', 'drivers.update'),
                  soon('indisponibilites', 'Flotte', 'Indisponibilités', 'unavailabilities.create'),
                  soon('utilisateurs', 'Administration', 'Utilisateurs', 'users.manage-roles'),
                  soon('outils', 'Administration', 'Outils', 'tooling.access'),
                  soon('communes', 'Administration', 'Communes', 'municipalities.manage'),
                ],
              },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
