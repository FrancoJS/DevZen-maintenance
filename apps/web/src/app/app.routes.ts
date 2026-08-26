import { Route } from '@angular/router';
import { HomePage } from './features/home/home-page';
import { PlaceholderPage } from './features/placeholder/placeholder-page';
import { roleGuard } from './core/role.guard';
import { UserRole } from './shared/navigation/navigation.model';

const ALL_ROLES: UserRole[] = ['REQUESTER', 'TECHNICIAN', 'ADMIN'];
export const appRoutes: Route[] = [
  { path: 'inicio', component: HomePage, title: 'Inicio | DevZen Maintenance', canActivate: [roleGuard], data: { roles: ALL_ROLES } },
  { path: 'mis-solicitudes', component: PlaceholderPage, title: 'Mis solicitudes | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Mis solicitudes', roles: ALL_ROLES } },
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
    ],
  },
  { path: 'mi-mantencion', component: PlaceholderPage, title: 'Mi mantención | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Mi mantención', roles: ['TECHNICIAN'] } },
  { path: 'historial-mantenciones', component: PlaceholderPage, title: 'Historial | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Historial', roles: ['TECHNICIAN'] } },
  { path: 'gestion-tickets', component: PlaceholderPage, title: 'Gestión de tickets | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Gestión de tickets', roles: ['ADMIN'] } },
  { path: 'tecnicos', component: PlaceholderPage, title: 'Técnicos | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Técnicos', roles: ['ADMIN'] } },
  { path: 'congelamientos', component: PlaceholderPage, title: 'Congelamientos | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Congelamientos', roles: ['ADMIN'] } },
  { path: 'historial-global', component: PlaceholderPage, title: 'Historial global | DevZen Maintenance', canActivate: [roleGuard], data: { title: 'Historial global', roles: ['ADMIN'] } },
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' },
];
