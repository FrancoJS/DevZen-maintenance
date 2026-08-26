import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'tickets',
    children: [
      {
        path: 'new',
        loadComponent: () =>
          import('./features/tickets/create-ticket/create-ticket-page.component').then(
            (module) => module.CreateTicketPageComponent
          ),
      },
    ],
  },
];
