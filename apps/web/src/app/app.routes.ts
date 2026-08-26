import { Route } from '@angular/router';
import { HomePage } from './features/home/home-page';
import { PlaceholderPage } from './features/placeholder/placeholder-page';

export const appRoutes: Route[] = [
  {
    path: 'inicio',
    component: HomePage,
    title: 'Inicio | DevZen Maintenance',
  },
  ...[
    ['gestion-tickets', 'Gestión de tickets'],
    ['tecnicos', 'Técnicos'],
    ['congelamientos', 'Congelamientos'],
    ['historial', 'Historial'],
  ].map(([path, title]) => ({
    path,
    component: PlaceholderPage,
    title: `${title} | DevZen Maintenance`,
    data: { title },
  })),
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' },
];
