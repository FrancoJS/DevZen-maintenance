import { Route } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginPageComponent } from './features/auth/login/login-page.component';
import { HomePage } from './features/home/home-page';
import { PlaceholderPage } from './features/placeholder/placeholder-page';
import { authGuard, guestGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { UserRole } from './shared/navigation/navigation.model';

const ALL_ROLES: UserRole[] = ['REQUESTER', 'TECHNICIAN', 'ADMIN'];
export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Iniciar sesión | DevZen Maintenance',
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: HomePage, title: 'Inicio | DevZen Maintenance', canActivate: [roleGuard], data: { roles: ALL_ROLES } },
      {
        path: 'mis-solicitudes',
        title: 'Mis solicitudes | DevZen Maintenance',
        canActivate: [roleGuard],
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import('./features/tickets/my-requests/my-requests-page.component').then(
            (module) => module.MyRequestsPageComponent
          ),
      },
      {
        path: 'crear-solicitud',
        title: 'Crear solicitud | DevZen Maintenance',
        canActivate: [roleGuard],
        data: { title: 'Crear solicitud', roles: ALL_ROLES },
        loadComponent: () =>
          import('./features/tickets/create-ticket/create-ticket-page.component').then(
            (module) => module.CreateTicketPageComponent
          ),
      },
      {
        path: 'tickets',
        children: [
          {
            path: 'new',
            title: 'Nueva solicitud | DevZen Maintenance',
            canActivate: [roleGuard],
            data: { title: 'Nueva solicitud', roles: ALL_ROLES },
            loadComponent: () =>
              import('./features/tickets/create-ticket/create-ticket-page.component').then(
                (module) => module.CreateTicketPageComponent
              ),
          },
          {
            path: ':id',
            title: 'Detalle del ticket | DevZen Maintenance',
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
        title: 'Mi mantención | DevZen Maintenance',
        canActivate: [roleGuard],
        data: { roles: ['TECHNICIAN'] },
        loadComponent: () =>
          import(
            './features/tickets/current-maintenance/current-maintenance-page.component'
          ).then((module) => module.CurrentMaintenancePageComponent),
      },
      {
        path: 'historial-mantenciones',
        title: 'Historial de mantenciones | DevZen Maintenance',
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
        title: 'Gestión de tickets | DevZen Maintenance',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import(
            './features/tickets/admin-ticket-management/admin-ticket-management-page.component'
          ).then((module) => module.AdminTicketManagementPageComponent),
      },
      { path: 'congelamientos', component: PlaceholderPage, title: 'Congelamientos | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Congelamientos', roles: ['ADMIN'] } },
      {
        path: 'historial-global',
        title: 'Historial global | DevZen Maintenance',
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
