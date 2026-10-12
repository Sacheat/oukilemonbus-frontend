import { createBrowserRouter } from 'react-router'
import { RequireAuth, RequireGuest, RequirePermission, RequireRole, RootRedirect } from './auth/guards'
import { PublicLayout } from './layouts/PublicLayout'
import { RoleLayout } from './layouts/RoleLayout'
import { SidebarLayout } from './layouts/SidebarLayout'
import { TopNavLayout } from './layouts/TopNavLayout'
import { lazyPage } from './lib/lazyPage'
import { BACKOFFICE_NAV, DRIVER_NAV, USER_NAV } from './navigation'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { NotFoundPage } from './pages/errors/NotFoundPage'
import { RouteErrorPage } from './pages/errors/RouteErrorPage'

// Pages connectées chargées à la demande (un fichier par page) ; connexion, inscription et erreurs restent dans le
// fichier de départ, puisque c'est par elles qu'on arrive.
const NotificationsPage = lazyPage(() => import('./pages/NotificationsPage'), 'NotificationsPage')
const AccountPage = lazyPage(() => import('./pages/account/AccountPage'), 'AccountPage')
const AlertDetailPage = lazyPage(() => import('./pages/backoffice/AlertDetailPage'), 'AlertDetailPage')
const AlertsPage = lazyPage(() => import('./pages/backoffice/AlertsPage'), 'AlertsPage')
const CollegePage = lazyPage(() => import('./pages/backoffice/CollegePage'), 'CollegePage')
const DashboardPage = lazyPage(() => import('./pages/backoffice/DashboardPage'), 'DashboardPage')
const BackofficeDocumentsPage = lazyPage(() => import('./pages/backoffice/DocumentsPage'), 'DocumentsPage')
const DriversPage = lazyPage(() => import('./pages/backoffice/DriversPage'), 'DriversPage')
const MunicipalitiesPage = lazyPage(() => import('./pages/backoffice/MunicipalitiesPage'), 'MunicipalitiesPage')
const OrganizationsManagementPage = lazyPage(() => import('./pages/backoffice/OrganizationsManagementPage'), 'OrganizationsManagementPage')
const PlanningPage = lazyPage(() => import('./pages/backoffice/PlanningPage'), 'PlanningPage')
const RequestsPage = lazyPage(() => import('./pages/backoffice/RequestsPage'), 'RequestsPage')
const ReservationEditPage = lazyPage(() => import('./pages/backoffice/ReservationEditPage'), 'ReservationEditPage')
const ReservationsQueuePage = lazyPage(() => import('./pages/backoffice/ReservationsQueuePage'), 'ReservationsQueuePage')
const ToolsPage = lazyPage(() => import('./pages/backoffice/ToolsPage'), 'ToolsPage')
const UnavailabilitiesPage = lazyPage(() => import('./pages/backoffice/UnavailabilitiesPage'), 'UnavailabilitiesPage')
const UsersPage = lazyPage(() => import('./pages/backoffice/UsersPage'), 'UsersPage')
const VehiclesPage = lazyPage(() => import('./pages/backoffice/VehiclesPage'), 'VehiclesPage')
const DriverJourneyPage = lazyPage(() => import('./pages/driver/DriverJourneyPage'), 'DriverJourneyPage')
const DriverMissionPage = lazyPage(() => import('./pages/driver/DriverMissionPage'), 'DriverMissionPage')
const DriverMissionsPage = lazyPage(() => import('./pages/driver/DriverMissionsPage'), 'DriverMissionsPage')
const DriverRouteSheetsPage = lazyPage(() => import('./pages/driver/DriverRouteSheetsPage'), 'DriverRouteSheetsPage')
const DriverUnavailabilitiesPage = lazyPage(() => import('./pages/driver/DriverUnavailabilitiesPage'), 'DriverUnavailabilitiesPage')
const CreateOrganizationRequestPage = lazyPage(() => import('./pages/user/CreateOrganizationRequestPage'), 'CreateOrganizationRequestPage')
const DocumentsPage = lazyPage(() => import('./pages/user/DocumentsPage'), 'DocumentsPage')
const EditReservationPage = lazyPage(() => import('./pages/user/EditReservationPage'), 'EditReservationPage')
const JoinOrganizationPage = lazyPage(() => import('./pages/user/JoinOrganizationPage'), 'JoinOrganizationPage')
const NewRecurrencePage = lazyPage(() => import('./pages/user/NewRecurrencePage'), 'NewRecurrencePage')
const NewReservationPage = lazyPage(() => import('./pages/user/NewReservationPage'), 'NewReservationPage')
const OrganizationDetailPage = lazyPage(() => import('./pages/user/OrganizationDetailPage'), 'OrganizationDetailPage')
const OrganizationsPage = lazyPage(() => import('./pages/user/OrganizationsPage'), 'OrganizationsPage')
const RecurrenceDetailPage = lazyPage(() => import('./pages/user/RecurrenceDetailPage'), 'RecurrenceDetailPage')
const RecurrencesPage = lazyPage(() => import('./pages/user/RecurrencesPage'), 'RecurrencesPage')
const TripDetailPage = lazyPage(() => import('./pages/user/TripDetailPage'), 'TripDetailPage')
const TripsPage = lazyPage(() => import('./pages/user/TripsPage'), 'TripsPage')
const UserHomePage = lazyPage(() => import('./pages/user/UserHomePage'), 'UserHomePage')

// Chemins en français, sauf /verify-email et /reset-password imposés par les liens
// des emails du backend.

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
                  {
                    path: 'documents',
                    element: (
                      <RequirePermission permission="documents.view">
                        <DocumentsPage />
                      </RequirePermission>
                    ),
                  },
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
                  { index: true, element: <DriverMissionsPage /> },
                  { path: 'missions/:missionId', element: <DriverMissionPage /> },
                  {
                    path: 'journee',
                    element: (
                      <RequirePermission permission="trip-progress.record">
                        <DriverJourneyPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'feuilles-de-route',
                    element: (
                      <RequirePermission permission="documents.view">
                        <DriverRouteSheetsPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'indisponibilites',
                    element: (
                      <RequirePermission permission="unavailabilities.view">
                        <DriverUnavailabilitiesPage />
                      </RequirePermission>
                    ),
                  },
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
                  {
                    index: true,
                    element: (
                      <RequirePermission permission="dashboard.view">
                        <DashboardPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'reservations',
                    element: (
                      <RequirePermission permission="reservations.approve">
                        <ReservationsQueuePage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'reservations/:id/modifier',
                    element: (
                      <RequirePermission permission="reservations.update">
                        <ReservationEditPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'planning',
                    element: (
                      <RequirePermission permission="reservations.view">
                        <PlanningPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'college',
                    element: (
                      <RequirePermission permission="council-decisions.create">
                        <CollegePage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'demandes',
                    element: (
                      <RequirePermission permission="org-registration-requests.review">
                        <RequestsPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'organisations',
                    element: (
                      <RequirePermission permission="organizations.update">
                        <OrganizationsManagementPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'documents',
                    element: (
                      <RequirePermission permission="documents.generate">
                        <BackofficeDocumentsPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'vehicules',
                    element: (
                      <RequirePermission permission="vehicles.update">
                        <VehiclesPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'chauffeurs',
                    element: (
                      <RequirePermission permission="drivers.update">
                        <DriversPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'indisponibilites',
                    element: (
                      <RequirePermission permission="unavailabilities.create">
                        <UnavailabilitiesPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'alertes',
                    element: (
                      <RequirePermission permission="driver-alerts.manage">
                        <AlertsPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'alertes/:alertId',
                    element: (
                      <RequirePermission permission="driver-alerts.manage">
                        <AlertDetailPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'utilisateurs',
                    element: (
                      <RequirePermission permission="users.manage-roles">
                        <UsersPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'outils',
                    element: (
                      <RequirePermission permission="tooling.access">
                        <ToolsPage />
                      </RequirePermission>
                    ),
                  },
                  {
                    path: 'communes',
                    element: (
                      <RequirePermission permission="municipalities.manage">
                        <MunicipalitiesPage />
                      </RequirePermission>
                    ),
                  },
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
