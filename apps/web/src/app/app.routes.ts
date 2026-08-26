import { Route } from '@angular/router';
import { HomePage } from './features/home/home-page';

export const appRoutes: Route[] = [
  {
    path: 'inicio',
    component: HomePage,
    title: 'Inicio | DevZen Maintenance',
  },
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: '**', redirectTo: 'inicio' },
];
