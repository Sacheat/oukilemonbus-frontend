import { createBrowserRouter } from 'react-router'
import { RequireAuth, RequireGuest, RequirePermission, RequireRole, RootRedirect } from './auth/guards'
import { PublicLayout } from './layouts/PublicLayout'
import { RoleLayout } from './layouts/RoleLayout'
import { SidebarLayout } from './layouts/SidebarLayout'
import { TopNavLayout } from './layouts/TopNavLayout'
import { BACKOFFICE_NAV, DRIVER_NAV, USER_NAV } from './navigation'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { AccountPage } from './pages/account/AccountPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { NotFoundPage } from './pages/errors/NotFoundPage'
import { RouteErrorPage } from './pages/errors/RouteErrorPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SpaceHomePage } from './pages/SpaceHomePage'
import { CreateOrganizationRequestPage } from './pages/user/CreateOrganizationRequestPage'
import { EditReservationPage } from './pages/user/EditReservationPage'
import { JoinOrganizationPage } from './pages/user/JoinOrganizationPage'
import { NewRecurrencePage } from './pages/user/NewRecurrencePage'
import { NewReservationPage } from './pages/user/NewReservationPage'
import { OrganizationDetailPage } from './pages/user/OrganizationDetailPage'
import { OrganizationsPage } from './pages/user/OrganizationsPage'
import { RecurrenceDetailPage } from './pages/user/RecurrenceDetailPage'
import { RecurrencesPage } from './pages/user/RecurrencesPage'
import { TripDetailPage } from './pages/user/TripDetailPage'
import { TripsPage } from './pages/user/TripsPage'
import { UserHomePage } from './pages/user/UserHomePage'

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
            children: [
              { path: 'connexion', element: <LoginPage /> },
              { path: 'inscription', element: <RegisterPage /> },
              { path: 'mot-de-passe-oublie', element: <ForgotPasswordPage /> },
            ],
          },
        ],
      },

      // Liens reçus par email : accessibles connecté ou non
      {
        element: <PublicLayout />,
        children: [
          { path: 'verify-email', element: <VerifyEmailPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },

      {
        element: <RequireAuth />,
        children: [
          // Pages communes à tous les rôles, dans le layout de l'espace de l'utilisateur
          {
            element: <RoleLayout />,
            children: [
              { path: 'compte', element: <AccountPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
            ],
          },

          // Espace usager (membres et responsables d'organisations)
          {
            path: 'espace',
            element: <RequireRole roles={['user']} />,
            children: [
              {
                element: <TopNavLayout nav={USER_NAV} />,
                children: [
                  { index: true, element: <UserHomePage /> },
                  {
                    path: 'deplacements',
                    element: <RequirePermission permission="reservations.view" />,
                    children: [
                      { index: true, element: <TripsPage /> },
                      { path: ':id', element: <TripDetailPage /> },
                      {
                        path: ':id/modifier',
                        element: (
                          <RequirePermission permission="reservations.update">
                            <EditReservationPage />
                          </RequirePermission>
                        ),
                      },
                    ],
                  },
                  {
                    path: 'reservations/nouvelle',
                    element: (
                      <RequirePermission permission="reservations.create">
                        <NewReservationPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'recurrences',
                    element: <RequirePermission permission="reservations.view" />,
                    children: [
                      { index: true, element: <RecurrencesPage /> },
                      {
                        path: 'nouvelle',
                        element: (
                          <RequirePermission permission="reservations.create">
                            <NewRecurrencePage />
                          </RequirePermission>
                        ),
                      },
                      { path: ':id', element: <RecurrenceDetailPage /> },
                    ],
                  },
                  {
                    path: 'organisations',
                    element: <RequirePermission permission="organizations.view" />,
                    children: [
                      { index: true, element: <OrganizationsPage /> },
                      {
                        path: 'rejoindre',
                        element: (
                          <RequirePermission permission="user-org-requests.create">
                            <JoinOrganizationPage />
                          </RequirePermission>
                        ),
                      },
                      {
                        path: 'creer',
                        element: (
                          <RequirePermission permission="org-registration-requests.create">
                            <CreateOrganizationRequestPage />
                          </RequirePermission>
                        ),
                      },
                      { path: ':id', element: <OrganizationDetailPage /> },
                    ],
                  },
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
