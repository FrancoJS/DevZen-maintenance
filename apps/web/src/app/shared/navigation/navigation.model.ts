export type UserRole = 'REQUESTER' | 'TECHNICIAN' | 'ADMIN';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  roles: UserRole[];
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    label: '',
    items: [
      {
        label: 'Panel de control',
        route: '/inicio',
        icon: 'lucideLayoutDashboard',
        roles: ['ADMIN'],
      },
      {
        label: 'Mi mantención',
        route: '/mi-mantencion',
        icon: 'lucideTickets',
        roles: ['TECHNICIAN'],
      },
      {
        label: 'Mis tickets',
        route: '/mis-solicitudes',
        icon: 'lucideClipboardList',
        roles: ['REQUESTER', 'TECHNICIAN', 'ADMIN'],
      },
      {
        label: 'Gestión de tickets',
        route: '/gestion-tickets',
        icon: 'lucideTickets',
        roles: ['ADMIN'],
      },
      {
        label: 'Congelamientos',
        route: '/congelamientos',
        icon: 'lucideSnowflake',
        roles: ['ADMIN'],
      },
      {
        label: 'Historial mantenciones',
        route: '/historial-mantenciones',
        icon: 'lucideHistory',
        roles: ['TECHNICIAN'],
      },
      {
        label: 'Historial mantenciones',
        route: '/historial-global',
        icon: 'lucideHistory',
        roles: ['ADMIN'],
      },
    ],
  },
];
