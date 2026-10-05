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
import { CreateOrganizationRequestPage } from './pages/user/CreateOrganizationRequestPage'
import { DocumentsPage } from './pages/user/DocumentsPage'
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
import { CollegePage } from './pages/backoffice/CollegePage'
import { DashboardPage } from './pages/backoffice/DashboardPage'
import { MunicipalitiesPage } from './pages/backoffice/MunicipalitiesPage'
import { RequestsPage } from './pages/backoffice/RequestsPage'
import { ToolsPage } from './pages/backoffice/ToolsPage'
import { UsersPage } from './pages/backoffice/UsersPage'
import { DriverJourneyPage } from './pages/driver/DriverJourneyPage'
import { DriverMissionPage } from './pages/driver/DriverMissionPage'
import { DriverMissionsPage } from './pages/driver/DriverMissionsPage'
import { DriverRouteSheetsPage } from './pages/driver/DriverRouteSheetsPage'
import { DriverUnavailabilitiesPage } from './pages/driver/DriverUnavailabilitiesPage'
import { DriversPage } from './pages/backoffice/DriversPage'
import { PlanningPage } from './pages/backoffice/PlanningPage'
import { ReservationEditPage } from './pages/backoffice/ReservationEditPage'
import { ReservationsQueuePage } from './pages/backoffice/ReservationsQueuePage'
import { AlertDetailPage } from './pages/backoffice/AlertDetailPage'
import { AlertsPage } from './pages/backoffice/AlertsPage'
import { OrganizationsManagementPage } from './pages/backoffice/OrganizationsManagementPage'
import { UnavailabilitiesPage } from './pages/backoffice/UnavailabilitiesPage'
import { VehiclesPage } from './pages/backoffice/VehiclesPage'

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
                  soon('documents', 'Gestion', 'Documents', 'documents.generate'),
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
