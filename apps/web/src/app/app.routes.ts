import { Route } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginPageComponent } from './features/auth/login/login-page.component';
import { homeGuard } from './core/home.guard';
import { authGuard, guestGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { UserRole } from './shared/navigation/navigation.model';

const ALL_ROLES: UserRole[] = ['REQUESTER', 'TECHNICIAN', 'ADMIN'];
export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Iniciar sesión | DevZen Ops',
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        title: 'Panel de control | DevZen Ops',
        canActivate: [homeGuard],
        loadComponent: () => import('./features/dashboard/admin-dashboard-page.component')
          .then((module) => module.AdminDashboardPageComponent),
      },
      {
        path: 'mis-solicitudes',
        title: 'Mis tickets | DevZen Ops',
        canActivate: [roleGuard],
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import('./features/tickets/my-requests/my-requests-page.component').then(
            (module) => module.MyRequestsPageComponent
          ),
      },
      {
        path: 'crear-solicitud',
        pathMatch: 'full',
        redirectTo: () => '/mis-solicitudes?create=1',
      },
      {
        path: 'tickets',
        children: [
          {
            path: 'new',
            pathMatch: 'full',
            redirectTo: () => '/mis-solicitudes?create=1',
          },
          {
            path: ':id',
            title: 'Detalle del ticket | DevZen Ops',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN'] },
            loadComponent: () =>
              import(
                './features/tickets/admin-ticket-detail/admin-ticket-detail-page.component'
              ).then((module) => module.AdminTicketDetailPageComponent),
          },
        ],
      },
      {
        path: 'mi-mantencion',
        title: 'Mi mantención | DevZen Ops',
        canActivate: [roleGuard],
        data: { roles: ['TECHNICIAN'] },
        loadComponent: () =>
          import(
            './features/tickets/current-maintenance/current-maintenance-page.component'
          ).then((module) => module.CurrentMaintenancePageComponent),
      },
      {
        path: 'historial-mantenciones',
        title: 'Historial de mantenciones | DevZen Ops',
        canActivate: [roleGuard],
        data: { roles: ['TECHNICIAN'] },
        loadComponent: () =>
          import(
            './features/tickets/technician-maintenance-history/technician-maintenance-history-page.component'
          ).then(
            (module) => module.TechnicianMaintenanceHistoryPageComponent
          ),
      },
      {
        path: 'gestion-tickets',
        title: 'Gestión de tickets | DevZen Ops',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import(
            './features/tickets/admin-ticket-management/admin-ticket-management-page.component'
          ).then((module) => module.AdminTicketManagementPageComponent),
      },
      {
        path: 'congelamientos',
        title: 'Congelamientos | DevZen Ops',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import(
            './features/tickets/admin-freeze-management/admin-freeze-management-page.component'
          ).then((module) => module.AdminFreezeManagementPageComponent),
      },
      {
        path: 'historial-global',
        title: 'Historial global | DevZen Ops',
        canActivate: [roleGuard],
        data: { historyScope: 'global', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/tickets/maintenance-history/maintenance-history-page.component').then(
            (module) => module.MaintenanceHistoryPageComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
